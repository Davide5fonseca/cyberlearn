const crypto = require('crypto');
const bcrypt = require('bcrypt');
const router = require('express').Router();
const { pool } = require('../config/db');
const { enviarCodigo2FA, enviarCodigoRecuperacao } = require('../config/mailer');
const { gerarToken, autenticar } = require('../middlewares/auth');
const { limiterAuth } = require('../middlewares/rateLimit');
const { asyncHandler } = require('../middlewares/errors');
const { obterIp, gravarLogAcesso, gravarLogSeguranca } = require('../services/logs');
const { criarNotificacao } = require('../services/notificacoes');
const {
    validar, registarSchema, loginSchema, login2FASchema,
    recuperarSenhaSchema, resetPasswordSchema, atualizarPerfilSchema
} = require('../validacao/schemas');

router.post('/registar', limiterAuth, validar(registarSchema), asyncHandler(async (req, res) => {
    // O schema já validou nome/email/password e normalizou o email.
    // Apenas alunos e professores se podem registar. Contas de admin
    // nunca são criadas por este endpoint público (anti escalada de privilégios).
    const { nome, email, password, tipo: perfil } = req.body;

    const userExists = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ erro: 'Este email já está registado.' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Professores nascem inativos: só entram depois de o admin aprovar a conta
    // (perfil com acesso a dados pessoais dos alunos).
    const ativo = perfil !== 'professor';

    const novoUtilizador = await pool.query(
        `INSERT INTO utilizadores (nome, email, password_hash, perfil, data_registo, ativo)
         VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING id, nome, email, perfil`,
        [nome, email, passwordHash, perfil, ativo]
    );

    if (perfil === 'professor') {
        await criarNotificacao({
            perfil_alvo: 'admin',
            icone: '🧑‍🏫', cor: '#f59e0b',
            titulo: 'Professor a Aguardar Aprovação',
            mensagem: `${nome} registou-se como professor e aguarda validação da conta.`,
            acao: 'admin_aprovacoes'
        });
        return res.status(201).json({
            mensagem: 'Conta criada! Um administrador vai validar o teu perfil de professor antes de poderes entrar.',
            utilizador: novoUtilizador.rows[0]
        });
    }

    res.status(201).json({ mensagem: 'Conta criada com sucesso!', utilizador: novoUtilizador.rows[0] });
}, 'Erro interno ao criar conta.'));

router.post('/login', limiterAuth, validar(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
    const ip = obterIp(req);
    if (result.rows.length === 0) {
        await gravarLogSeguranca('login_falha', email, null, ip);
        return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });
    }
    const utilizador = result.rows[0];
    const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
    if (!passwordValida) {
        await gravarLogSeguranca('login_falha', email, null, ip);
        return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });
    }

    // Contas de professor por aprovar não recebem código 2FA nem entram.
    if ((utilizador.perfil || '').toLowerCase().trim() === 'professor' && utilizador.ativo === false) {
        return res.status(403).json({ erro: 'A tua conta de professor ainda aguarda aprovação do administrador.' });
    }

    // crypto.randomInt: gerador criptograficamente seguro (Math.random é previsível).
    const codigo2FA = crypto.randomInt(100000, 1000000).toString();
    const expiracao = new Date(Date.now() + 10 * 60000);

    await pool.query(
        'UPDATE utilizadores SET codigo_email_2fa = $1, codigo_email_expiracao = $2, codigo_2fa_tentativas = 0 WHERE id = $3',
        [codigo2FA, expiracao, utilizador.id]
    );

    await enviarCodigo2FA(utilizador, codigo2FA);

    res.status(200).json({ requires2FA: true, utilizadorId: utilizador.id, mensagem: 'Código enviado para o teu email!' });
}, 'Erro interno ao fazer login.'));

router.post('/login-2fa', limiterAuth, validar(login2FASchema), asyncHandler(async (req, res) => {
    const { utilizadorId, token } = req.body;
    const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [utilizadorId]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });

    const utilizador = result.rows[0];
    const ip2FA = obterIp(req);

    if (!utilizador.codigo_email_2fa) {
        return res.status(401).json({ erro: 'Não há nenhum código ativo. Volta ao login.' });
    }
    if (utilizador.codigo_email_2fa !== token) {
        // Ao fim de 5 falhas o código é anulado — impede a iteração do espaço de códigos.
        const upd = await pool.query(
            'UPDATE utilizadores SET codigo_2fa_tentativas = codigo_2fa_tentativas + 1 WHERE id = $1 RETURNING codigo_2fa_tentativas',
            [utilizador.id]
        );
        await gravarLogSeguranca('2fa_falha', utilizador.email, utilizador.id, ip2FA);
        if (upd.rows[0].codigo_2fa_tentativas >= 5) {
            await pool.query('UPDATE utilizadores SET codigo_email_2fa = NULL, codigo_email_expiracao = NULL WHERE id = $1', [utilizador.id]);
            return res.status(401).json({ erro: 'Demasiadas tentativas falhadas. Volta a iniciar sessão para receber um código novo.' });
        }
        return res.status(401).json({ erro: 'Código incorreto. Tenta novamente.' });
    }
    if (new Date() > new Date(utilizador.codigo_email_expiracao)) {
        await gravarLogSeguranca('2fa_falha', utilizador.email, utilizador.id, ip2FA);
        return res.status(401).json({ erro: 'Este código já expirou. Volta ao login.' });
    }

    await pool.query('UPDATE utilizadores SET codigo_email_2fa = NULL, codigo_email_expiracao = NULL WHERE id = $1', [utilizador.id]);
    await gravarLogAcesso(utilizador.id, utilizador.nome);
    await gravarLogSeguranca('login_sucesso', utilizador.email, utilizador.id, ip2FA);

    // STREAKS
    let novoStreak = 1;
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const lastLogin = utilizador.last_login_date ? new Date(utilizador.last_login_date).toISOString().split('T')[0] : null;

        if (lastLogin === hoje) novoStreak = utilizador.streak_count || 1;
        else if (lastLogin === ontem) novoStreak = (utilizador.streak_count || 0) + 1;
        else novoStreak = 1;

        await pool.query('UPDATE utilizadores SET last_login_date = $1, streak_count = $2 WHERE id = $3', [hoje, novoStreak, utilizador.id]);
    } catch (streakErr) {
        // O streak é acessório: uma falha aqui não deve impedir o login.
        console.error('⚠️ Erro ao atualizar streak:', streakErr.message);
    }

    const authToken = gerarToken(utilizador);

    res.status(200).json({
        mensagem: 'Acesso validado com sucesso!',
        token: authToken,
        utilizador: {
            id: utilizador.id, nome: utilizador.nome, email: utilizador.email,
            tipo: utilizador.perfil, data_registo: utilizador.data_registo,
            avatar: utilizador.avatar, biografiaProf: utilizador.biografia_prof,
            metodologia: utilizador.metodologia, nivelExperiencia: utilizador.nivel_experiencia,
            interesse: utilizador.area_interesse, biografia: utilizador.biografia,
            conquistas: utilizador.conquistas, github: utilizador.github, linkedin: utilizador.linkedin,
            streakCount: novoStreak
        }
    });
}, 'Erro interno ao verificar o código.'));

router.post('/recuperar-senha', limiterAuth, validar(recuperarSenhaSchema), asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(200).json({ mensagem: 'Se o email existir, receberás um código.' });

    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const tokenExpiry = new Date(Date.now() + 15 * 60000);

    await pool.query(
        'UPDATE utilizadores SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
        [resetCode, tokenExpiry, email]
    );

    await enviarCodigoRecuperacao(email, resetCode);
    res.status(200).json({ mensagem: 'Código enviado com sucesso.' });
}, 'Erro interno ao processar o pedido.'));

router.post('/reset-password', limiterAuth, validar(resetPasswordSchema), asyncHandler(async (req, res) => {
    const { email, token, novaPassword } = req.body;
    const result = await pool.query(
        'SELECT * FROM utilizadores WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()',
        [email, token]
    );

    if (result.rows.length === 0) return res.status(400).json({ erro: 'O código inserido está incorreto ou já expirou.' });

    const utilizador = result.rows[0];
    const salt = await bcrypt.genSalt(10);
    const novaPasswordHash = await bcrypt.hash(novaPassword, salt);

    await pool.query(
        'UPDATE utilizadores SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
        [novaPasswordHash, utilizador.id]
    );

    res.status(200).json({ mensagem: 'Palavra-passe atualizada com sucesso! Já podes fazer login.' });
}, 'Erro interno ao processar o pedido.'));

// Mapa campo do pedido → coluna na BD. Só os campos presentes no corpo são
// atualizados: um pedido parcial nunca apaga os restantes dados do perfil.
const CAMPOS_PERFIL = {
    nome: 'nome',
    avatar: 'avatar',
    biografiaProf: 'biografia_prof',
    metodologia: 'metodologia',
    nivelExperiencia: 'nivel_experiencia',
    interesse: 'area_interesse',
    biografia: 'biografia',
    github: 'github',
    linkedin: 'linkedin'
};

router.post('/atualizar-perfil', autenticar, validar(atualizarPerfilSchema), asyncHandler(async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    // A identidade vem sempre do token, nunca do corpo do pedido.
    const id = req.user.id;

    const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });

    const utilizador = result.rows[0];

    const sets = [];
    const valores = [];
    for (const [campo, coluna] of Object.entries(CAMPOS_PERFIL)) {
        if (req.body[campo] !== undefined) {
            valores.push(req.body[campo]);
            sets.push(`${coluna} = $${valores.length}`);
        }
    }

    if (novaSenha) {
        if (!senhaAtual) return res.status(400).json({ erro: 'Precisas de inserir a senha atual para mudar a segurança.' });

        const isValid = await bcrypt.compare(senhaAtual, utilizador.password_hash);
        if (!isValid) return res.status(401).json({ erro: 'A palavra-passe atual está incorreta.' });

        const salt = await bcrypt.genSalt(10);
        valores.push(await bcrypt.hash(novaSenha, salt));
        sets.push(`password_hash = $${valores.length}`);
    }

    if (sets.length > 0) {
        valores.push(id);
        await pool.query(`UPDATE utilizadores SET ${sets.join(', ')} WHERE id = $${valores.length}`, valores);
    }

    res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
}, 'Erro interno ao processar o pedido.'));

module.exports = router;

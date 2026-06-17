require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET não está definido no ambiente. Por segurança, o servidor não vai arrancar.');
    process.exit(1);
}

const app = express();

// Necessário atrás de um proxy (Vercel) para ler o IP real e para o rate-limit.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==========================================
// MIDDLEWARES DE SEGURANÇA (JWT + RATE LIMIT)
// ==========================================
const gerarToken = (u) => jwt.sign(
    { id: u.id, perfil: (u.perfil || '').toLowerCase().trim(), nome: u.nome, email: u.email },
    JWT_SECRET,
    { expiresIn: '12h' }
);

// Exige um token válido. Preenche req.user = { id, perfil, nome, email }.
const autenticar = (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ erro: 'Autenticação necessária.' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ erro: 'Sessão inválida ou expirada. Volta a iniciar sessão.' });
    }
};

// Exige que o perfil do utilizador esteja na lista permitida.
const exigirPerfil = (...perfis) => (req, res, next) => {
    if (!req.user || !perfis.includes(req.user.perfil)) {
        return res.status(403).json({ erro: 'Não tens permissão para realizar esta ação.' });
    }
    next();
};

// Permite o próprio utilizador (id no URL) OU um dos perfis elevados indicados.
const proprioOuPerfil = (...perfis) => (req, res, next) => {
    const alvo = parseInt(req.params.id ?? req.params.utilizadorId, 10);
    if (req.user && (req.user.id === alvo || perfis.includes(req.user.perfil))) return next();
    return res.status(403).json({ erro: 'Não tens permissão para aceder a estes dados.' });
};

// Limita tentativas em rotas sensíveis de autenticação (anti brute-force).
const limiterAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Demasiadas tentativas. Por favor aguarda alguns minutos e tenta novamente.' }
});

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false }
});

// ==========================================
// 0. INICIALIZAÇÃO DE TABELAS & FUNÇÕES AUX
// ==========================================
app.get('/teste-bd', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ mensagem: 'Ligação ao PostgreSQL feita com sucesso!', tempo: result.rows[0] });
    } catch (err) {
        console.error("Erro na base de dados:", err.message);
        res.status(500).json({ erro: 'Falha na ligação à base de dados.', detalhe: err.message });
    }
});

const gravarLogAcesso = async (utilizadorId, nome) => {
    try {
        await pool.query(`
            INSERT INTO logs_acesso (id, utilizador_id, data_hora_acesso) 
            VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM logs_acesso), $1, NOW())
        `, [utilizadorId]);
        console.log(`✅ LOGIN GRAVADO NA BD: O utilizador ${nome} entrou na plataforma!`);
    } catch (erroAcesso) {
        console.error(`❌ ERRO AO GRAVAR ACESSO de ${nome}:`, erroAcesso.message);
    }
};

const gravarLogSeguranca = async (tipo, email, utilizadorId, ip) => {
    try {
        await pool.query(
            'INSERT INTO logs_seguranca (tipo, email, utilizador_id, ip) VALUES ($1, $2, $3, $4)',
            [tipo, email || null, utilizadorId || null, ip || null]
        );
    } catch (err) {
        console.error('❌ Erro ao gravar log de segurança:', err.message);
    }
};

// Tabelas de Logs e Notificações Persistentes
pool.query(`
    CREATE TABLE IF NOT EXISTS logs_seguranca (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(50),
        email VARCHAR(255),
        utilizador_id INTEGER,
        ip VARCHAR(100),
        data_criacao TIMESTAMP DEFAULT NOW()
    )
`).catch(err => console.error('❌ Erro logs_seguranca:', err.message));

pool.query(`
    CREATE TABLE IF NOT EXISTS notificacoes_sistema (
        id SERIAL PRIMARY KEY,
        utilizador_id INTEGER NULL,
        perfil_alvo VARCHAR(50) NULL,
        icone VARCHAR(50),
        cor VARCHAR(50),
        titulo VARCHAR(255),
        mensagem TEXT,
        acao VARCHAR(255),
        data_criacao TIMESTAMP DEFAULT NOW()
    )
`).then(() => console.log('✅ Tabela notificacoes_sistema verificada/criada.'))
  .catch(err => console.error('❌ Erro notificacoes_sistema:', err.message));

// Função Global para criar notificações na Base de Dados
const criarNotificacao = async ({ utilizador_id = null, perfil_alvo = null, icone, cor, titulo, mensagem, acao }) => {
    try {
        await pool.query(
            'INSERT INTO notificacoes_sistema (utilizador_id, perfil_alvo, icone, cor, titulo, mensagem, acao) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [utilizador_id, perfil_alvo, icone, cor, titulo, mensagem, acao]
        );
        console.log(`🔔 Notificação criada para [${perfil_alvo || utilizador_id}]: ${titulo}`);
    } catch (err) {
        console.error('❌ Erro ao injetar notificação:', err.message);
    }
};

// ==========================================
// 1. CONFIGURAÇÃO DE EMAIL (NODEMAILER)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.error("❌ Erro de ligação ao Email (Verifica o .env):", error.message);
    } else {
        console.log("✅ Servidor de Email pronto para mensagens!");
    }
});

// ==========================================
// 2. AUTENTICAÇÃO E GESTÃO DE PERFIL
// ==========================================
app.post('/registar', limiterAuth, async (req, res) => {
    const { nome, email, password, tipo } = req.body;
    try {
        // Apenas alunos e professores se podem registar. Contas de admin
        // nunca são criadas por este endpoint público (anti escalada de privilégios).
        const perfil = String(tipo || '').toLowerCase().trim();
        if (!['aluno', 'professor'].includes(perfil)) {
            return res.status(400).json({ erro: 'Tipo de conta inválido.' });
        }
        if (!nome || !email || !password) {
            return res.status(400).json({ erro: 'Nome, email e palavra-passe são obrigatórios.' });
        }

        const userExists = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        if (userExists.rows.length > 0) return res.status(400).json({ erro: 'Este email já está registado.' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const novoUtilizador = await pool.query(
            `INSERT INTO utilizadores (nome, email, password_hash, perfil, data_registo, ativo)
             VALUES ($1, $2, $3, $4, NOW(), true) RETURNING id, nome, email, perfil`,
            [nome, email, passwordHash, perfil]
        );

        res.status(201).json({ mensagem: 'Conta criada com sucesso!', utilizador: novoUtilizador.rows[0] });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao criar conta.' });
    }
});

app.post('/login', limiterAuth, async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
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

        const codigo2FA = Math.floor(100000 + Math.random() * 900000).toString();
        const expiracao = new Date(Date.now() + 10 * 60000); 

        await pool.query(
            'UPDATE utilizadores SET codigo_email_2fa = $1, codigo_email_expiracao = $2 WHERE id = $3',
            [codigo2FA, expiracao, utilizador.id]
        );

        const mailOptions = {
            from: `"CyberLearn Segurança" <${process.env.EMAIL_USER}>`,
            to: utilizador.email,
            subject: 'CyberLearn - Código de Verificação',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px; text-align: center;">
                    <h2 style="color: #171f2f;">Código de Segurança 🛡️</h2>
                    <p style="color: #333; font-size: 16px;">Olá ${utilizador.nome},</p>
                    <p style="color: #333; font-size: 16px;">Para entrares na tua conta CyberLearn, insere o seguinte código de 6 dígitos:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${codigo2FA}
                    </div>
                    <p style="color: #6b7280; font-size: 12px;">Este código é válido por 10 minutos.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ requires2FA: true, utilizadorId: utilizador.id, mensagem: 'Código enviado para o teu email!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao fazer login.' });
    }
});

app.post('/login-2fa', limiterAuth, async (req, res) => {
    const { utilizadorId, token } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [utilizadorId]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
        
        const utilizador = result.rows[0];

        if (!utilizador.codigo_email_2fa || utilizador.codigo_email_2fa !== token) {
            await gravarLogSeguranca('2fa_falha', utilizador.email, utilizador.id, req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null);
            return res.status(401).json({ erro: 'Código incorreto. Tenta novamente.' });
        }
        if (new Date() > new Date(utilizador.codigo_email_expiracao)) {
            await gravarLogSeguranca('2fa_falha', utilizador.email, utilizador.id, req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null);
            return res.status(401).json({ erro: 'Este código já expirou. Volta ao login.' });
        }

        await pool.query('UPDATE utilizadores SET codigo_email_2fa = NULL, codigo_email_expiracao = NULL WHERE id = $1', [utilizador.id]);
        const ipLogin = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
        await gravarLogAcesso(utilizador.id, utilizador.nome);
        await gravarLogSeguranca('login_sucesso', utilizador.email, utilizador.id, ipLogin);

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
        } catch (streakErr) {}

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
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao verificar o código.' });
    }
});

app.post('/recuperar-senha', limiterAuth, async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(200).json({ mensagem: 'Se o email existir, receberás um código.' });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiry = new Date(Date.now() + 15 * 60000); 

        await pool.query(
            'UPDATE utilizadores SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
            [resetCode, tokenExpiry, email]
        );

        const mailOptions = {
            from: `"CyberLearn Suporte" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'CyberLearn - Código de Recuperação de Senha',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px; text-align: center;">
                    <h2 style="color: #171f2f;">Recuperação de Palavra-Passe 🛡️</h2>
                    <p style="color: #333; font-size: 16px;">Para criares uma nova palavra-passe, insere este código na plataforma:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${resetCode}
                    </div>
                    <p style="color: #6b7280; font-size: 12px;">Válido por 15 minutos. Se não pediste isto, ignora o email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ mensagem: 'Código enviado com sucesso.' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

app.post('/reset-password', limiterAuth, async (req, res) => {
    const { email, token, novaPassword } = req.body;
    try {
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
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

app.post('/atualizar-perfil', autenticar, async (req, res) => {
    const {
        nome, senhaAtual, novaSenha, avatar,
        biografiaProf, metodologia,
        nivelExperiencia, interesse, biografia, conquistas, github, linkedin
    } = req.body;
    // A identidade vem sempre do token, nunca do corpo do pedido.
    const id = req.user.id;

    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });

        const utilizador = result.rows[0];
        let newPasswordHash = utilizador.password_hash;

        if (novaSenha) {
            if (!senhaAtual) return res.status(400).json({ erro: 'Precisas de inserir a senha atual para mudar a segurança.' });
            
            const isValid = await bcrypt.compare(senhaAtual, utilizador.password_hash);
            if (!isValid) return res.status(401).json({ erro: 'A palavra-passe atual está incorreta.' });

            const salt = await bcrypt.genSalt(10);
            newPasswordHash = await bcrypt.hash(novaSenha, salt);
        }

        await pool.query(
            `UPDATE utilizadores SET 
                nome = $1, password_hash = $2, avatar = $3, 
                biografia_prof = $4, metodologia = $5,
                nivel_experiencia = $6, area_interesse = $7, biografia = $8, github = $9, linkedin = $10
            WHERE id = $11`,
            [nome, newPasswordHash, avatar, biografiaProf, metodologia, nivelExperiencia, interesse, biografia, github, linkedin, id]
        );

        res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

// ==========================================
// 3. GESTÃO DE CURSOS
// ==========================================
app.get('/cursos', autenticar, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.nome as nome_professor
            FROM cursos c 
            LEFT JOIN utilizadores u ON c.professor_id = u.id 
            WHERE c.aprovado = true
            ORDER BY c.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar os cursos.' });
    }
});

app.post('/cursos', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    const { titulo, nivel, descricao, conteudo_licao } = req.body;
    // O autor é sempre o utilizador autenticado.
    const professor_id = req.user.id;
    try {
        const result = await pool.query(
            'INSERT INTO cursos (titulo, nivel, descricao, conteudo_licao, professor_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [titulo, nivel, descricao, conteudo_licao, professor_id]
        );

        // NOTIFICAR O ADMINISTRADOR
        const profRes = await pool.query('SELECT nome FROM utilizadores WHERE id = $1', [professor_id]);
        const profNome = profRes.rows[0]?.nome || 'Um professor';
        
        await criarNotificacao({
            perfil_alvo: 'admin',
            icone: '⏳', cor: '#f59e0b',
            titulo: 'Curso a Aguardar Aprovação',
            mensagem: `${profNome} pede autorização para publicar o curso "${titulo}".`,
            acao: 'admin_aprovacoes'
        });

        res.status(201).json({ mensagem: 'Curso publicado e a aguardar aprovação!', curso: result.rows[0] });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao criar o curso.' });
    }
});

app.put('/cursos/:id', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    const { id } = req.params;
    const { titulo, nivel, descricao, conteudo_licao } = req.body;
    try {
        if (req.user.perfil === 'professor') {
            const dono = await pool.query('SELECT professor_id FROM cursos WHERE id = $1', [id]);
            if (dono.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });
            if (dono.rows[0].professor_id !== req.user.id) return res.status(403).json({ erro: 'Só podes editar os teus próprios cursos.' });
        }
        await pool.query(
            'UPDATE cursos SET titulo = $1, nivel = $2, descricao = $3, conteudo_licao = $4 WHERE id = $5',
            [titulo, nivel, descricao, conteudo_licao, id]
        );
        res.status(200).json({ mensagem: 'Curso atualizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao atualizar o curso.' });
    }
});

app.delete('/cursos/:id', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    const { id } = req.params;
    try {
        if (req.user.perfil === 'professor') {
            const dono = await pool.query('SELECT professor_id FROM cursos WHERE id = $1', [id]);
            if (dono.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });
            if (dono.rows[0].professor_id !== req.user.id) return res.status(403).json({ erro: 'Só podes apagar os teus próprios cursos.' });
        }
        await pool.query('DELETE FROM quizzes WHERE curso_id = $1', [id]);
        await pool.query('DELETE FROM cursos WHERE id = $1', [id]);
        res.status(200).json({ mensagem: 'Curso apagado permanentemente!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao apagar o curso.' });
    }
});

// ==========================================
// 4. GESTÃO DE QUIZZES E RESULTADOS
// ==========================================
app.get('/quizzes', autenticar, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT q.*, c.titulo as nome_curso, c.nivel as nivel_curso
            FROM quizzes q 
            JOIN cursos c ON q.curso_id = c.id 
            WHERE q.aprovado = true
            ORDER BY q.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar as avaliações.' });
    }
});

app.post('/quizzes', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    const { titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta } = req.body;
    try {
        // Um professor só pode adicionar perguntas a cursos seus.
        if (req.user.perfil === 'professor') {
            const dono = await pool.query('SELECT professor_id FROM cursos WHERE id = $1', [curso_id]);
            if (dono.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });
            if (dono.rows[0].professor_id !== req.user.id) return res.status(403).json({ erro: 'Só podes criar quizzes para os teus próprios cursos.' });
        }
        await pool.query(
            'INSERT INTO quizzes (titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta]
        );

        // NOTIFICAR O ADMINISTRADOR
        await criarNotificacao({
            perfil_alvo: 'admin',
            icone: '⏳', cor: '#f59e0b',
            titulo: 'Quiz a Aguardar Aprovação',
            mensagem: `O questionário do tema "${titulo}" precisa de autorização para ser publicado.`,
            acao: 'admin_aprovacoes'
        });

        res.status(201).json({ mensagem: 'Avaliação adicionada e a aguardar aprovação!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao guardar a avaliação na base de dados.' });
    }
});

app.delete('/quizzes/:titulo', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    const { titulo } = req.params;
    try {
        if (req.user.perfil === 'professor') {
            const donos = await pool.query(
                'SELECT DISTINCT c.professor_id FROM quizzes q JOIN cursos c ON q.curso_id = c.id WHERE q.titulo = $1',
                [titulo]
            );
            const alheio = donos.rows.some(r => r.professor_id !== req.user.id);
            if (donos.rows.length === 0 || alheio) {
                return res.status(403).json({ erro: 'Só podes apagar quizzes dos teus próprios cursos.' });
            }
        }
        await pool.query('DELETE FROM quizzes WHERE titulo = $1', [titulo]);
        res.status(200).json({ mensagem: 'Avaliação apagada permanentemente!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao apagar o quiz.' });
    }
});

app.post('/quizzes/salvar-resultado', autenticar, async (req, res) => {
    const { quizTitulo, acertos, totalPerguntas } = req.body;
    const utilizadorId = req.user.id;
    try {
        await pool.query(
            'INSERT INTO tentativas_quizzes (utilizador_id, quiz_titulo, acertos, total_perguntas) VALUES ($1, $2, $3, $4)',
            [utilizadorId, quizTitulo, acertos, totalPerguntas]
        );
        res.status(200).json({ mensagem: 'Resultado salvo com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao salvar resultado.' });
    }
});

// ==========================================
// 5. GAMIFICAÇÃO E XP
// ==========================================
app.get('/conquistas/:utilizadorId', autenticar, proprioOuPerfil('professor', 'admin'), async (req, res) => {
    try {
        const { utilizadorId } = req.params;
        const result = await pool.query(`
            SELECT c.nome, c.descricao, c.icone, to_char(uc.data_obtencao, 'DD/MM/YYYY') as data
            FROM utilizador_conquistas uc
            JOIN conquistas_catalogo c ON uc.conquista_id = c.id
            WHERE uc.utilizador_id = $1
            ORDER BY uc.data_obtencao DESC
        `, [utilizadorId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar conquistas.' });
    }
});

app.post('/conquistas/atribuir', autenticar, async (req, res) => {
    const { nomeConquista } = req.body;
    const utilizadorId = req.user.id;
    try {
        const conquistaRes = await pool.query('SELECT id FROM conquistas_catalogo WHERE nome = $1', [nomeConquista]);
        if (conquistaRes.rows.length === 0) return res.status(404).json({ erro: 'Troféu não existe no catálogo.' });
        
        const conquistaId = conquistaRes.rows[0].id;
        await pool.query(`
            INSERT INTO utilizador_conquistas (utilizador_id, conquista_id) 
            VALUES ($1, $2) ON CONFLICT DO NOTHING
        `, [utilizadorId, conquistaId]);

        res.status(200).json({ mensagem: 'Troféu validado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atribuir conquista.' });
    }
});

app.post('/xp/adicionar', autenticar, async (req, res) => {
    const { quantidade } = req.body;
    const utilizadorId = req.user.id;
    try {
        // Limita a quantidade de XP por pedido para evitar abusos.
        const xp = Math.max(0, Math.min(parseInt(quantidade, 10) || 0, 100));
        const result = await pool.query(
            'UPDATE utilizadores SET xp_total = xp_total + $1 WHERE id = $2 RETURNING xp_total',
            [xp, utilizadorId]
        );
        res.status(200).json({ mensagem: 'XP Adicionado', xp_total: result.rows[0].xp_total });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao adicionar pontos de experiência.' });
    }
});

app.get('/classificacao', autenticar, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, avatar, xp_total 
            FROM utilizadores 
            WHERE LOWER(TRIM(perfil)) = 'aluno' 
            ORDER BY xp_total DESC NULLS LAST
            LIMIT 10
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar a classificação.' });
    }
});

// ==========================================
// 6. DASHBOARDS (ESTATÍSTICAS)
// ==========================================
app.get('/estatisticas/aluno/:id', autenticar, proprioOuPerfil('professor', 'admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const userRes = await pool.query('SELECT xp_total FROM utilizadores WHERE id = $1', [id]);
        const xpTotal = userRes.rows[0]?.xp_total || 0;

        const trofeusRes = await pool.query('SELECT COUNT(*) FROM utilizador_conquistas WHERE utilizador_id = $1', [id]);
        const modulosConcluidos = parseInt(trofeusRes.rows[0].count);

        const logsRes = await pool.query('SELECT COUNT(DISTINCT DATE(data_hora_acesso)) FROM logs_acesso WHERE utilizador_id = $1', [id]);
        const diasSeguidos = parseInt(logsRes.rows[0].count); 

        const cursosRes = await pool.query('SELECT * FROM cursos WHERE aprovado = true ORDER BY data_criacao DESC LIMIT 4');
        const cursos = cursosRes.rows;

        const cursoDestaque = cursos.length > 0 ? {
            id: cursos[0].id, titulo: cursos[0].titulo, moduloAtual: 'Lição Inicial',
            progresso: modulosConcluidos > 0 ? 50 : 0, tempoRestante: 'Sempre disponível'
        } : null;

        const cores = ['#f59e0b', '#10b981', '#3b82f6']; 
        const cursosAtivos = cursos.slice(1).map((c, index) => ({
            id: c.id, titulo: c.titulo, modulo: 'Módulo Base', progresso: 0, cor: cores[index % cores.length]
        }));

        res.status(200).json({
            stats: { modulosConcluidos, pontuacaoTotal: xpTotal, taxaAcerto: modulosConcluidos > 0 ? 100 : 0, diasSeguidos },
            cursoDestaque, cursosAtivos
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar dados do dashboard.' });
    }
});

app.get('/admin-estatisticas', autenticar, exigirPerfil('admin'), async (req, res) => {
    try {
        const profsResult = await pool.query("SELECT COUNT(*) FROM utilizadores WHERE LOWER(TRIM(perfil)) = 'professor'");
        const sessoesResult = await pool.query("SELECT COUNT(DISTINCT utilizador_id) FROM logs_acesso WHERE data_hora_acesso >= NOW() - INTERVAL '24 hours'");
        const acessosResult = await pool.query("SELECT COUNT(*) FROM logs_acesso");

        res.status(200).json({
            professoresAtivos: parseInt(profsResult.rows[0].count),
            sessoesAtivas: parseInt(sessoesResult.rows[0].count),
            totalAcessos: parseInt(acessosResult.rows[0].count),
            cargaSistema: 0 
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar estatísticas.' });
    }
});

app.get('/estatisticas/aluno/:id/atividades', autenticar, proprioOuPerfil('professor', 'admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const quizzesRes = await pool.query(`
            SELECT quiz_titulo as titulo, to_char(data_realizacao, 'YYYY-MM-DD') as data, 'Quiz' as tipo 
            FROM tentativas_quizzes 
            WHERE utilizador_id = $1
        `, [id]);

        const conquistasRes = await pool.query(`
            SELECT c.nome as titulo, to_char(uc.data_obtencao, 'YYYY-MM-DD') as data, 'Módulo/Troféu' as tipo
            FROM utilizador_conquistas uc
            JOIN conquistas_catalogo c ON uc.conquista_id = c.id
            WHERE uc.utilizador_id = $1
        `, [id]);

        const atividades = [...quizzesRes.rows, ...conquistasRes.rows];
        res.status(200).json(atividades);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar calendário.' });
    }
});

// ==========================================
// 7. LISTAGEM DE UTILIZADORES E ACESSOS
// ==========================================
app.get('/alunos', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo,
                   avatar, nivel_experiencia as "nivelExperiencia", area_interesse as interesse, biografia, github, linkedin
            FROM utilizadores 
            WHERE LOWER(TRIM(perfil)) = 'aluno' 
            ORDER BY nome ASC
        `);
        res.status(200).json(result.rows);
    } catch (err) { 
        res.status(500).json({ erro: 'Erro interno ao carregar a lista de alunos.' }); 
    }
});

app.get('/professores', autenticar, exigirPerfil('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo,
                   avatar, biografia_prof as "biografiaProf", metodologia
            FROM utilizadores 
            WHERE LOWER(TRIM(perfil)) = 'professor' 
            ORDER BY nome ASC
        `);
        res.status(200).json(result.rows);
    } catch (err) { 
        res.status(500).json({ erro: 'Erro interno ao carregar a lista de professores.' }); 
    }
});

app.get('/acessos', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.id, u.nome, u.email, u.avatar, to_char(a.data_hora_acesso, 'DD/MM/YYYY HH24:MI') as data
            FROM logs_acesso a
            JOIN utilizadores u ON a.utilizador_id = u.id
            WHERE LOWER(TRIM(u.perfil)) = 'aluno'
            ORDER BY a.data_hora_acesso DESC
            LIMIT 50
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno ao carregar a tabela.' });
    }
});

app.get('/acessos-professores', autenticar, exigirPerfil('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.id, u.nome, u.email, u.avatar, to_char(a.data_hora_acesso, 'DD/MM/YYYY HH24:MI') as data
            FROM logs_acesso a
            JOIN utilizadores u ON a.utilizador_id = u.id
            WHERE LOWER(TRIM(u.perfil)) = 'professor'
            ORDER BY a.data_hora_acesso DESC
            LIMIT 50
        `);
        res.status(200).json(result.rows);
    } catch (err) { 
        res.status(500).json({ erro: 'Erro interno ao carregar os acessos dos professores.' }); 
    }
});

app.get('/professor/alunos', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, email, xp_total, avatar 
            FROM utilizadores 
            WHERE LOWER(TRIM(perfil)) = 'aluno'
            ORDER BY xp_total DESC NULLS LAST
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar alunos.' });
    }
});

app.get('/professor/aluno/:id/detalhes', autenticar, exigirPerfil('professor', 'admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const userRes = await pool.query(
            'SELECT biografia, nivel_experiencia, area_interesse, github, linkedin FROM utilizadores WHERE id = $1', 
            [id]
        );
        
        const trofeusRes = await pool.query(`
            SELECT c.nome, c.icone, to_char(uc.data_obtencao, 'DD/MM/YYYY') as data
            FROM utilizador_conquistas uc
            JOIN conquistas_catalogo c ON uc.conquista_id = c.id
            WHERE uc.utilizador_id = $1
            ORDER BY uc.data_obtencao DESC
        `, [id]);

        const notasRes = await pool.query(`
            SELECT quiz_titulo, acertos, total_perguntas, to_char(data_realizacao, 'DD/MM/YYYY HH24:MI') as data
            FROM tentativas_quizzes
            WHERE utilizador_id = $1
            ORDER BY data_realizacao DESC
        `, [id]);

        res.status(200).json({
            biografia: userRes.rows[0]?.biografia,
            nivel_experiencia: userRes.rows[0]?.nivel_experiencia,
            area_interesse: userRes.rows[0]?.area_interesse,
            github: userRes.rows[0]?.github,
            linkedin: userRes.rows[0]?.linkedin,
            trofeus: trofeusRes.rows,
            quizzes: notasRes.rows
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar perfil.' });
    }
});

// ==========================================
// 8. APAGAR UTILIZADORES E CARREGAR INFOS PROF
// ==========================================
app.delete('/utilizadores/:id', autenticar, exigirPerfil('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM resultados_quizzes WHERE utilizador_id = $1', [id]);
        await pool.query('DELETE FROM tentativas_quizzes WHERE utilizador_id = $1', [id]);
        await pool.query('DELETE FROM utilizador_conquistas WHERE utilizador_id = $1', [id]);
        await pool.query('DELETE FROM logs_acesso WHERE utilizador_id = $1', [id]);
        await pool.query('DELETE FROM utilizadores WHERE id = $1', [id]);
        res.status(200).json({ mensagem: 'Utilizador eliminado com sucesso.' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao eliminar utilizador da base de dados.' });
    }
});

app.get('/professor/cursos/:id', autenticar, proprioOuPerfil('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM cursos WHERE professor_id = $1 ORDER BY id DESC', [id]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar cursos do professor.' });
    }
});

app.get('/professor/quizzes/:id', autenticar, proprioOuPerfil('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT q.*, c.titulo as nome_curso, c.nivel as nivel_curso 
            FROM quizzes q 
            JOIN cursos c ON q.curso_id = c.id 
            WHERE c.professor_id = $1 
            ORDER BY q.id DESC
        `, [id]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar quizzes do professor.' });
    }
});

app.delete('/professores/:id', autenticar, exigirPerfil('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM logs_acesso WHERE utilizador_id = $1', [id]);
        await pool.query(`
            DELETE FROM quizzes 
            WHERE curso_id IN (SELECT id FROM cursos WHERE professor_id = $1)
        `, [id]);
        await pool.query('DELETE FROM cursos WHERE professor_id = $1', [id]);
        
        const result = await pool.query("DELETE FROM utilizadores WHERE id = $1 AND LOWER(TRIM(perfil)) = 'professor' RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Professor não encontrado.' });
        res.status(200).json({ mensagem: 'Professor e todos os seus dados eliminados com sucesso!' });
    } catch (err) { 
        res.status(500).json({ erro: 'Erro interno ao tentar eliminar o professor.' }); 
    }
});

// ==========================================
// 9. CENTRO DE NOTIFICAÇÕES
// ==========================================
app.get('/notificacoes/:id', autenticar, proprioOuPerfil('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const userRes = await pool.query('SELECT perfil FROM utilizadores WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
        
        const perfil = userRes.rows[0].perfil.toLowerCase().trim();
        let notificacoes = [];

        // 1. Notificações Persistentes do Sistema (Aprovações, Rejeições, Pedidos Admin, etc)
        // Corrigido com ::INTEGER explícito e garantia de types!
        const dbNotifsRes = await pool.query(`
            SELECT id, icone, cor, titulo, mensagem, to_char(data_criacao, 'DD/MM/YYYY') as data, acao
            FROM notificacoes_sistema
            WHERE utilizador_id = $1::INTEGER OR perfil_alvo = $2
            ORDER BY data_criacao DESC
            LIMIT 15
        `, [id, perfil]);

        const notificacoesSistema = dbNotifsRes.rows.map(n => ({
            id: `sys_${n.id}`,
            icone: n.icone,
            cor: n.cor,
            titulo: n.titulo,
            mensagem: n.mensagem,
            data: n.data,
            acao: n.acao,
            labelAcao: 'Aceder →'
        }));
        
        notificacoes = [...notificacoesSistema];

        // 2. Notificações Dinâmicas (Específicas de Aluno)
        if (perfil === 'aluno') {
            const trofeusRes = await pool.query(`
                SELECT c.nome, c.icone, to_char(uc.data_obtencao, 'DD/MM/YYYY') as data
                FROM utilizador_conquistas uc
                JOIN conquistas_catalogo c ON uc.conquista_id = c.id
                WHERE uc.utilizador_id = $1
                ORDER BY uc.data_obtencao DESC
                LIMIT 3
            `, [id]);
            
            const notificacoesTrofeus = trofeusRes.rows.map(t => ({
                id: `trofeu_${t.nome}`,
                icone: t.icone || '🏆',
                cor: '#f59e0b',
                titulo: 'Nova Medalha Desbloqueada!',
                mensagem: `Desbloqueaste o troféu: ${t.nome}`,
                data: t.data,
                acao: 'profile',
                labelAcao: 'Ver Perfil →'
            }));
            notificacoes = [...notificacoes, ...notificacoesTrofeus];

            const comentariosRes = await pool.query(`
                SELECT cl.curso_id, c.titulo as nome_curso, cl.nome_utilizador, 
                       to_char(cl.data_criacao, 'DD/MM/YYYY') as data
                FROM comentarios_licao cl
                JOIN cursos c ON cl.curso_id = c.id
                WHERE cl.utilizador_id != $1
                ORDER BY cl.data_criacao DESC
                LIMIT 2
            `, [id]);
            const notificacoesComentarios = comentariosRes.rows.map((c, i) => ({
                id: `comentario_${c.curso_id}_${i}`,
                icone: '💬',
                cor: '#10b981',
                titulo: 'Novo Comentário na Lição',
                mensagem: `${c.nome_utilizador} comentou em "${c.nome_curso}".`,
                data: c.data,
                acao: 'cursos',
                cursoId: c.curso_id,
                labelAcao: 'Ver Lição →'
            }));
            notificacoes = [...notificacoes, ...notificacoesComentarios];

            try {
                const ctfRes = await pool.query('SELECT COUNT(*) FROM ctf_desafios WHERE ativo = TRUE');
                const totalCtf = parseInt(ctfRes.rows[0].count);
                if (totalCtf > 0) {
                    const resolvidosRes = await pool.query(
                        'SELECT COUNT(*) FROM ctf_tentativas WHERE utilizador_id = $1', [id]
                    );
                    const resolvidos = parseInt(resolvidosRes.rows[0].count);
                    if (resolvidos < totalCtf) {
                        notificacoes.push({
                            id: 'ctf_disponivel',
                            icone: '💻', cor: '#8b5cf6',
                            titulo: 'Desafio CTF Disponível',
                            mensagem: `Tens ${totalCtf - resolvidos} desafio(s) CTF por resolver no Terminal. +XP disponível!`,
                            data: 'Hoje', acao: 'labs', labelAcao: 'Ir para Labs →'
                        });
                    }
                }
            } catch (ctfErr) { }
        }

        res.status(200).json(notificacoes.slice(0, 10));
    } catch (err) {
        console.error("Erro ao carregar notificações:", err.message);
        res.status(500).json({ erro: 'Erro ao carregar notificações.' });
    }
});


// ==========================================
// 10. APROVAÇÕES DO ADMIN
// ==========================================
app.get('/admin/pendentes', autenticar, exigirPerfil('admin'), async (req, res) => {
    try {
        const cursosRes = await pool.query(`
            SELECT c.*, u.nome as nome_professor 
            FROM cursos c 
            LEFT JOIN utilizadores u ON c.professor_id = u.id 
            WHERE c.aprovado = false 
            ORDER BY c.data_criacao DESC
        `);
        
        const quizzesRes = await pool.query(`
            SELECT q.titulo, c.titulo as nome_curso, u.nome as nome_professor, COUNT(q.id) as num_perguntas
            FROM quizzes q 
            JOIN cursos c ON q.curso_id = c.id 
            LEFT JOIN utilizadores u ON c.professor_id = u.id
            WHERE q.aprovado = false 
            GROUP BY q.titulo, c.titulo, u.nome
        `);
        
        res.status(200).json({ cursos: cursosRes.rows, quizzes: quizzesRes.rows });
    } catch (err) {
        console.error("Erro na pendentes:", err);
        res.status(500).json({ erro: 'Erro ao carregar pendentes.' });
    }
});

app.put('/admin/aprovar/curso/:id', autenticar, exigirPerfil('admin'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const cursoRes = await pool.query('SELECT titulo, professor_id FROM cursos WHERE id = $1', [id]);
        
        if (cursoRes.rows.length > 0) {
            const { titulo, professor_id } = cursoRes.rows[0];
            await pool.query(`UPDATE cursos SET aprovado = true WHERE id = $1`, [id]);
            
            // Notificar Professor (específico)
            await criarNotificacao({
                utilizador_id: professor_id, icone: '✅', cor: '#10b981',
                titulo: 'Curso Aprovado!',
                mensagem: `Boas notícias! O teu curso "${titulo}" foi aprovado pelo administrador e já está online.`,
                acao: 'professor_cursos'
            });

            // Notificar Alunos (todos)
            await criarNotificacao({
                perfil_alvo: 'aluno', icone: '📚', cor: '#3b82f6',
                titulo: 'Novo Curso Disponível',
                mensagem: `O curso "${titulo}" acabou de ser publicado na plataforma. Vai dar uma vista de olhos!`,
                acao: 'cursos'
            });

            res.status(200).json({ mensagem: `Curso aprovado com sucesso!` });
        } else {
            res.status(404).json({ erro: `Curso não encontrado.` });
        }
    } catch (err) {
        console.error("Erro aprovar curso:", err);
        res.status(500).json({ erro: `Erro ao aprovar curso.` });
    }
});

app.delete('/admin/rejeitar/curso/:id', autenticar, exigirPerfil('admin'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const cursoRes = await pool.query('SELECT titulo, professor_id FROM cursos WHERE id = $1', [id]);
        
        if (cursoRes.rows.length > 0) {
            const { titulo, professor_id } = cursoRes.rows[0];
            
            // É fundamental garantir que estas ações ocorrem na ordem certa para a BD não atrofiar com restrições
            await pool.query('DELETE FROM resultados_quizzes WHERE quiz_id IN (SELECT id FROM quizzes WHERE curso_id = $1)', [id]).catch(() => {});
            await pool.query('DELETE FROM quizzes WHERE curso_id = $1', [id]);
            await pool.query('DELETE FROM comentarios_licao WHERE curso_id = $1', [id]).catch(() => {});
            await pool.query(`DELETE FROM cursos WHERE id = $1`, [id]);
            
            // Notificar Professor
            await criarNotificacao({
                utilizador_id: professor_id, icone: '❌', cor: '#ef4444',
                titulo: 'Curso Rejeitado',
                mensagem: `Infelizmente, o administrador não aprovou a publicação do teu curso "${titulo}". Ele foi removido.`,
                acao: 'professor_cursos'
            });

            res.status(200).json({ mensagem: `Curso rejeitado e apagado.` });
        } else {
            res.status(404).json({ erro: `Curso não encontrado.` });
        }
    } catch (err) {
        console.error("Erro ao rejeitar curso:", err);
        res.status(500).json({ erro: `Erro ao rejeitar curso.` });
    }
});

// ... Todo o teu código acima disto permanece igual ...

app.put('/admin/aprovar/quiz', autenticar, exigirPerfil('admin'), async (req, res) => {
    // Recebe o título em segurança pelo corpo da mensagem
    const { titulo } = req.body; 
    
    try {
        const quizRes = await pool.query(`
            SELECT q.titulo, c.professor_id 
            FROM quizzes q 
            JOIN cursos c ON q.curso_id = c.id 
            WHERE q.titulo = $1 LIMIT 1
        `, [titulo]);

        if (quizRes.rows.length > 0) {
            const prof_id = quizRes.rows[0].professor_id;
            await pool.query(`UPDATE quizzes SET aprovado = true WHERE titulo = $1`, [titulo]);
            
            // Notificar Professor
            await criarNotificacao({
                utilizador_id: prof_id, icone: '✅', cor: '#10b981',
                titulo: 'Quiz Aprovado!',
                mensagem: `O teu questionário para o tema "${titulo}" foi aprovado com sucesso!`,
                acao: 'professor_cursos'
            });

            // Notificar Alunos
            await criarNotificacao({
                perfil_alvo: 'aluno', icone: '🎯', cor: '#8b5cf6',
                titulo: 'Novo Quiz Disponível',
                mensagem: `O teste de avaliação para o módulo "${titulo}" já está disponível.`,
                acao: 'quizzes'
            });

            res.status(200).json({ mensagem: `Quiz aprovado com sucesso!` });
        } else {
            res.status(404).json({ erro: `Quiz não encontrado na base de dados.` });
        }
    } catch (err) {
        console.error("ERRO AO APROVAR QUIZ:", err);
        res.status(500).json({ erro: `Erro ao aprovar quiz.` });
    }
});

app.post('/admin/rejeitar/quiz', autenticar, exigirPerfil('admin'), async (req, res) => {
    // Usamos POST para garantir que o body chega intacto
    const { titulo } = req.body;
    
    try {
        const quizRes = await pool.query(`
            SELECT q.titulo, c.professor_id 
            FROM quizzes q 
            JOIN cursos c ON q.curso_id = c.id 
            WHERE q.titulo = $1 LIMIT 1
        `, [titulo]);

        if (quizRes.rows.length > 0) {
            const prof_id = quizRes.rows[0].professor_id;
            
            // Apaga as tentativas do quiz antes de apagar o quiz em si
            await pool.query(`DELETE FROM tentativas_quizzes WHERE quiz_titulo = $1`, [titulo]).catch(()=>console.log("Sem tentativas."));
            await pool.query(`DELETE FROM quizzes WHERE titulo = $1`, [titulo]);
            
            // Notificar Professor
            await criarNotificacao({
                utilizador_id: prof_id, icone: '❌', cor: '#ef4444',
                titulo: 'Quiz Rejeitado',
                mensagem: `O teu questionário para o tema "${titulo}" não passou na avaliação do sistema e foi removido.`,
                acao: 'professor_cursos'
            });

            res.status(200).json({ mensagem: `Quiz rejeitado e apagado.` });
        } else {
            res.status(404).json({ erro: `Quiz não encontrado.` });
        }
    } catch (err) {
        console.error("ERRO AO REJEITAR QUIZ:", err);
        res.status(500).json({ erro: `Erro ao rejeitar quiz.` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
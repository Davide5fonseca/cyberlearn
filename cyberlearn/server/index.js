require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

console.log("👉 A LER O EMAIL DO .ENV:", process.env.EMAIL_USER);

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const pool = new Pool({
    // O Render vai injetar aqui o link da base de dados
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // OBRIGATÓRIO: Permite ligações seguras na nuvem
    }
});

// ==========================================
// TESTE DE LIGAÇÃO
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

// ==========================================
// FUNÇÃO AUXILIAR PARA GRAVAR ACESSOS NA BD
// ==========================================
const gravarLogAcesso = async (utilizadorId, nome) => {
    try {
        await pool.query(`
            INSERT INTO logs_acesso (id, utilizador_id, data_hora_acesso) 
            VALUES (
                (SELECT COALESCE(MAX(id), 0) + 1 FROM logs_acesso), 
                $1, 
                NOW()
            )
        `, [utilizadorId]);
        console.log(`✅ LOGIN GRAVADO NA BD: O utilizador ${nome} entrou na plataforma!`);
    } catch (erroAcesso) {
        console.error(`❌ ERRO AO GRAVAR ACESSO de ${nome}:`, erroAcesso.message);
    }
};

// ==========================================
// CONFIGURAÇÃO DO EMAIL (NODEMAILER)
// ==========================================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Importante ser false para a porta 587
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.error("❌ Erro de ligação ao Email (Verifica o .env e a Palavra-passe de App):", error.message);
    } else {
        console.log("✅ Servidor de Email pronto para enviar mensagens!");
    }
});

// ==========================================
// ROTA DE REGISTO E LOGIN
// ==========================================
app.post('/registar', async (req, res) => {
    const { nome, email, password, tipo } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        if (userExists.rows.length > 0) return res.status(400).json({ erro: 'Este email já está registado.' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const novoUtilizador = await pool.query(
            `INSERT INTO utilizadores (nome, email, password_hash, perfil, data_registo, ativo) 
             VALUES ($1, $2, $3, $4, NOW(), true) RETURNING id, nome, email, perfil`,
            [nome, email, passwordHash, tipo]
        );

        res.status(201).json({ mensagem: 'Conta criada com sucesso!', utilizador: novoUtilizador.rows[0] });

    } catch (err) {
        console.error("Erro ao registar:", err.message);
        res.status(500).json({ erro: 'Erro interno ao criar conta.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });

        const utilizador = result.rows[0];
        const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
        if (!passwordValida) return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });

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
                    <p style="color: #6b7280; font-size: 12px;">Este código é válido por 10 minutos. Se não tentaste fazer login, ignora este e-mail.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ requires2FA: true, utilizadorId: utilizador.id, mensagem: 'Código enviado para o teu email!' });

    } catch (err) {
        console.error("Erro no login:", err.message);
        res.status(500).json({ erro: 'Erro interno ao fazer login.' });
    }
});

app.post('/login-2fa', async (req, res) => {
    const { utilizadorId, token } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [utilizadorId]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
        
        const utilizador = result.rows[0];

        if (!utilizador.codigo_email_2fa || utilizador.codigo_email_2fa !== token) {
            return res.status(401).json({ erro: 'Código incorreto. Tenta novamente.' });
        }
        if (new Date() > new Date(utilizador.codigo_email_expiracao)) {
            return res.status(401).json({ erro: 'Este código já expirou. Volta ao login para receber um novo.' });
        }

        await pool.query('UPDATE utilizadores SET codigo_email_2fa = NULL, codigo_email_expiracao = NULL WHERE id = $1', [utilizador.id]);
        await gravarLogAcesso(utilizador.id, utilizador.nome);

        res.status(200).json({ 
            mensagem: 'Acesso validado com sucesso!', 
            utilizador: { 
                id: utilizador.id, 
                nome: utilizador.nome, 
                email: utilizador.email, 
                tipo: utilizador.perfil, 
                data_registo: utilizador.data_registo,
                avatar: utilizador.avatar_url,
                biografiaProf: utilizador.biografia_prof,
                metodologia: utilizador.metodologia,
                nivelExperiencia: utilizador.nivel_experiencia,
                interesse: utilizador.interesse,
                biografia: utilizador.biografia,
                conquistas: utilizador.conquistas,
                github: utilizador.github,
                linkedin: utilizador.linkedin
            } 
        });

    } catch (err) {
        console.error("Erro no 2FA:", err.message);
        res.status(500).json({ erro: 'Erro interno ao verificar o código.' });
    }
});

// ==========================================
// ROTA DE RECUPERAR SENHA
// ==========================================
app.post('/recuperar-senha', async (req, res) => {
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
        console.log(`✅ Código de recuperação enviado para: ${email}`);

        res.status(200).json({ mensagem: 'Código enviado com sucesso.' });

    } catch (err) {
        console.error("Erro na recuperação de senha:", err.message);
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

app.post('/reset-password', async (req, res) => {
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
        console.error("Erro ao atualizar senha:", err.message);
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

// ==========================================
// ROTA PARA ATUALIZAR O PERFIL
// ==========================================
app.post('/atualizar-perfil', async (req, res) => {
    const { 
        id, nome, senhaAtual, novaSenha, avatar, 
        biografiaProf, metodologia, 
        nivelExperiencia, interesse, biografia, conquistas, github, linkedin 
    } = req.body; 

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
                nome = $1, password_hash = $2, avatar_url = $3, 
                biografia_prof = $4, metodologia = $5,
                nivel_experiencia = $6, interesse = $7, biografia = $8, conquistas = $9, github = $10, linkedin = $11
            WHERE id = $12`,
            [nome, newPasswordHash, avatar, biografiaProf, metodologia, nivelExperiencia, interesse, biografia, conquistas, github, linkedin, id]
        );

        res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });

    } catch (err) {
        console.error("Erro ao atualizar perfil:", err.message);
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

// ==========================================
// ROTAS PARA CRIAR, LISTAR E APAGAR CURSOS
// ==========================================
app.get('/cursos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.nome as nome_professor 
            FROM cursos c 
            LEFT JOIN utilizadores u ON c.professor_id = u.id 
            ORDER BY c.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar cursos:", err.message);
        res.status(500).json({ erro: 'Erro ao carregar os cursos.' });
    }
});

app.post('/cursos', async (req, res) => {
    const { titulo, nivel, descricao, conteudo_licao, professor_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO cursos (titulo, nivel, descricao, conteudo_licao, professor_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [titulo, nivel, descricao, conteudo_licao, professor_id]
        );
        res.status(201).json({ mensagem: 'Curso publicado com sucesso na plataforma!', curso: result.rows[0] });
    } catch (err) {
        console.error("Erro ao criar curso:", err.message);
        res.status(500).json({ erro: 'Erro interno ao criar o curso.' });
    }
});

app.delete('/cursos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM quizzes WHERE curso_id = $1', [id]);
        await pool.query('DELETE FROM cursos WHERE id = $1', [id]);
        res.status(200).json({ mensagem: 'Curso apagado permanentemente!' });
    } catch (err) {
        console.error("Erro ao apagar curso:", err.message);
        res.status(500).json({ erro: 'Erro interno ao apagar o curso.' });
    }
});

// ==========================================
// ROTAS PARA CRIAR E LISTAR QUIZZES
// ==========================================
app.get('/quizzes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT q.*, c.titulo as nome_curso 
            FROM quizzes q 
            JOIN cursos c ON q.curso_id = c.id 
            ORDER BY q.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar quizzes:", err.message);
        res.status(500).json({ erro: 'Erro ao carregar as avaliações.' });
    }
});

app.post('/quizzes', async (req, res) => {
    const { titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta } = req.body;
    try {
        await pool.query(
            'INSERT INTO quizzes (titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta]
        );
        res.status(201).json({ mensagem: 'Avaliação adicionada ao curso com sucesso!' });
    } catch (err) {
        console.error("Erro ao criar quiz:", err.message);
        res.status(500).json({ erro: 'Erro ao guardar a avaliação na base de dados.' });
    }
});

// ==========================================
// ROTAS DE GESTÃO E ADMINISTRAÇÃO
// ==========================================
app.get('/alunos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo,
                   avatar_url, nivel_experiencia as "nivelExperiencia", interesse, biografia, conquistas, github, linkedin
            FROM utilizadores 
            WHERE LOWER(TRIM(perfil)) = 'aluno' 
            ORDER BY nome ASC
        `);
        res.status(200).json(result.rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ erro: 'Erro interno ao carregar a lista de alunos.' }); 
    }
});

app.get('/acessos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.id, u.nome, u.email, to_char(a.data_hora_acesso, 'DD/MM/YYYY HH24:MI') as data
            FROM logs_acesso a
            JOIN utilizadores u ON a.utilizador_id = u.id
            WHERE LOWER(TRIM(u.perfil)) = 'aluno'
            ORDER BY a.data_hora_acesso DESC
            LIMIT 50
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar acessos:", err.message);
        res.status(500).json({ erro: 'Erro interno ao carregar a tabela.' });
    }
});

app.get('/professores', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo,
                   avatar_url, biografia_prof as "biografiaProf", metodologia 
            FROM utilizadores 
            WHERE LOWER(TRIM(perfil)) = 'professor' 
            ORDER BY nome ASC
        `);
        res.status(200).json(result.rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ erro: 'Erro interno ao carregar a lista de professores.' }); 
    }
});

app.get('/acessos-professores', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.id, u.nome, u.email, to_char(a.data_hora_acesso, 'DD/MM/YYYY HH24:MI') as data
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

app.delete('/professores/:id', async (req, res) => {
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
        console.error("Erro fatal ao eliminar professor:", err);
        res.status(500).json({ erro: 'Erro interno ao tentar eliminar o professor.' }); 
    }
});

app.get('/admin-estatisticas', async (req, res) => {
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
        console.error("Erro nas estatísticas:", err);
        res.status(500).json({ erro: 'Erro ao carregar estatísticas.' });
    }
});

// ==========================================
// ROTAS PARA CRIAR E LISTAR QUIZZES
// ==========================================
app.get('/quizzes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT q.*, c.titulo as nome_curso 
            FROM quizzes q 
            JOIN cursos c ON q.curso_id = c.id 
            ORDER BY q.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar as avaliações.' });
    }
});

app.post('/quizzes', async (req, res) => {
    const { titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta } = req.body;
    try {
        await pool.query(
            'INSERT INTO quizzes (titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta]
        );
        res.status(201).json({ mensagem: 'Avaliação adicionada ao curso com sucesso!' });
    } catch (err) {
        console.error("Erro ao criar quiz:", err.message);
        res.status(500).json({ erro: 'Erro ao guardar a avaliação na base de dados.' });
    }
});

// NOVA ROTA A ADICIONAR: APAGAR QUIZ PELO TÍTULO
app.delete('/quizzes/:titulo', async (req, res) => {
    const { titulo } = req.params;
    try {
        await pool.query('DELETE FROM quizzes WHERE titulo = $1', [titulo]);
        res.status(200).json({ mensagem: 'Avaliação apagada permanentemente!' });
    } catch (err) {
        console.error("Erro ao apagar quiz:", err.message);
        res.status(500).json({ erro: 'Erro interno ao apagar o quiz.' });
    }
});

// ==========================================
// ARRANQUE DO SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
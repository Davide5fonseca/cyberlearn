const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
});

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
// ROTA DE REGISTO
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

// ==========================================
// ROTA DE LOGIN E REGISTO DE ACESSO
// ==========================================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });

        const utilizador = result.rows[0];
        const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
        if (!passwordValida) return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });

        try {
            await pool.query(`
                INSERT INTO logs_acesso (id, utilizador_id, data_hora_acesso) 
                VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM logs_acesso), $1, NOW())
            `, [utilizador.id]);
        } catch (erroAcesso) {
            console.error("❌ ERRO AO GRAVAR ACESSO:", erroAcesso.message);
        }

        res.status(200).json({ 
            mensagem: 'Login efetuado com sucesso!', 
            utilizador: { id: utilizador.id, nome: utilizador.nome, email: utilizador.email, tipo: utilizador.perfil }
        });
    } catch (err) {
        console.error("Erro no login:", err.message);
        res.status(500).json({ erro: 'Erro interno ao fazer login.' });
    }
});

// ==========================================
// ROTA DE RECUPERAR SENHA
// ==========================================
app.post('/recuperar-senha', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(200).json({ mensagem: 'Se o email existir, receberás um link de recuperação.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); 

        await pool.query('UPDATE utilizadores SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3', [resetToken, tokenExpiry, email]);

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });

        const mailOptions = {
            from: `"CyberLearn Suporte" <${process.env.EMAIL_USER}>`,
            to: email, subject: 'CyberLearn - Recuperação de Palavra-Passe',
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Recuperação de Palavra-Passe</h2><a href="${resetLink}" style="padding: 12px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Criar Nova Palavra-Passe</a></div>`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ mensagem: 'Se o email existir, receberás um link de recuperação.' });
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao processar o pedido.' }); }
});

app.post('/reset-password', async (req, res) => {
    const { token, novaPassword } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE reset_token = $1 AND reset_token_expiry > NOW()', [token]);
        if (result.rows.length === 0) return res.status(400).json({ erro: 'O link de recuperação é inválido ou já expirou.' });
        const salt = await bcrypt.genSalt(10);
        const novaPasswordHash = await bcrypt.hash(novaPassword, salt);
        await pool.query('UPDATE utilizadores SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2', [novaPasswordHash, result.rows[0].id]);
        res.status(200).json({ mensagem: 'Palavra-passe atualizada com sucesso! Já podes fazer login.' });
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao processar o pedido.' }); }
});

app.post('/atualizar-perfil', async (req, res) => {
    const { id, nome, senhaAtual, novaSenha } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
        let newPasswordHash = result.rows[0].password_hash;
        if (novaSenha) {
            if (!senhaAtual) return res.status(400).json({ erro: 'Precisas de inserir a senha atual para mudar a segurança.' });
            const isValid = await bcrypt.compare(senhaAtual, result.rows[0].password_hash);
            if (!isValid) return res.status(401).json({ erro: 'A palavra-passe atual está incorreta.' });
            const salt = await bcrypt.genSalt(10);
            newPasswordHash = await bcrypt.hash(novaSenha, salt);
        }
        await pool.query('UPDATE utilizadores SET nome = $1, password_hash = $2 WHERE id = $3', [nome, newPasswordHash, id]);
        res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao processar o pedido.' }); }
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
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao carregar a tabela.' }); }
});

// ==========================================
// NOVO: ROTA PARA CONTAR ALUNOS REGISTADOS
// ==========================================
app.get('/alunos/contagem', async (req, res) => {
    try {
        const result = await pool.query(`SELECT COUNT(*) FROM utilizadores WHERE LOWER(TRIM(perfil)) = 'aluno'`);
        res.status(200).json({ total: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error("Erro ao contar alunos:", err.message);
        res.status(500).json({ erro: 'Erro interno ao contar alunos.' });
    }
});

// ==========================================
// ROTA PARA CRIAR UM CURSO NA BD
// ==========================================
app.post('/cursos', async (req, res) => {
    const { titulo, nivel, descricao, conteudo_licao, professor_id } = req.body;
    
    // PROTEÇÃO ADICIONADA: Se o professor_id não existir, avisa para fazer login de novo
    if (!professor_id) {
        return res.status(400).json({ erro: 'Sessão desatualizada. Por favor, faz Logout e Login novamente.' });
    }

    try {
        const novoCurso = await pool.query(`
            INSERT INTO cursos (titulo, nivel, descricao, conteudo_licao, professor_id) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [titulo, nivel, descricao, conteudo_licao, professor_id]);

        console.log(`📚 NOVO CURSO CRIADO: ${titulo}`);
        res.status(201).json({ mensagem: 'Curso publicado com sucesso na Base de Dados!', curso: novoCurso.rows[0] });
    } catch (err) {
        console.error("❌ Erro ao criar curso:", err.message);
        res.status(500).json({ erro: 'Erro interno ao guardar o curso na BD.' });
    }
});

app.get('/cursos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cursos ORDER BY data_criacao DESC');
        res.status(200).json(result.rows);
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao carregar os cursos da BD.' }); }
});

app.delete('/cursos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM cursos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado ou já foi apagado.' });
        res.status(200).json({ mensagem: 'Curso apagado permanentemente com sucesso!' });
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao tentar apagar o curso.' }); }
});

app.post('/quizzes', async (req, res) => {
    const { titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta } = req.body;
    if (!curso_id) return res.status(400).json({ erro: 'Tens de selecionar um curso válido para associar este Quiz.' });
    if (!resposta_correta) return res.status(400).json({ erro: 'Tens de definir qual é a opção correta!' });

    try {
        const novoQuiz = await pool.query(`INSERT INTO quizzes (titulo, curso_id) VALUES ($1, $2) RETURNING id`, [titulo, curso_id]);
        const quizId = novoQuiz.rows[0].id; 
        await pool.query(
            `INSERT INTO perguntas_quiz (quiz_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [quizId, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta]
        );
        res.status(201).json({ mensagem: 'Quiz criado e guardado na Base de Dados com sucesso!' });
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao guardar o quiz na BD.' }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT} e à escuta de pedidos!`);
});
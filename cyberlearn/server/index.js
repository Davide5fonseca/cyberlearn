const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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
// ROTA DE REGISTO
// ==========================================
app.post('/registar', async (req, res) => {
    const { nome, email, password, tipo } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ erro: 'Este email já está registado.' });
        }

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
// ROTA DE LOGIN
// ==========================================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });
        }

        const utilizador = result.rows[0];
        const passwordValida = await bcrypt.compare(password, utilizador.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });
        }

        // ============================================================
        // VERIFICAR SE O 2FA ESTÁ ATIVADO ANTES DE ENTRAR
        // ============================================================
        if (utilizador.two_factor_enabled) {
            // Se tiver 2FA, pedimos o código ao frontend e não gravamos log ainda
            return res.status(200).json({ requires2FA: true, utilizadorId: utilizador.id });
        }

        // ============================================================
        // SE NÃO TIVER 2FA, GRAVA O ACESSO E FAZ LOGIN
        // ============================================================
        await gravarLogAcesso(utilizador.id, utilizador.nome);

        res.status(200).json({ 
            mensagem: 'Login efetuado com sucesso!', 
            utilizador: {
                id: utilizador.id,
                nome: utilizador.nome,
                email: utilizador.email,
                tipo: utilizador.perfil
            }
        });

    } catch (err) {
        console.error("Erro no login:", err.message);
        res.status(500).json({ erro: 'Erro interno ao fazer login.' });
    }
});

// ==========================================
// NOVA ROTA: LOGIN COM CÓDIGO 2FA (GOOGLE AUTHENTICATOR)
// ==========================================
app.post('/login-2fa', async (req, res) => {
    const { utilizadorId, token } = req.body;
    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [utilizadorId]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
        
        const utilizador = result.rows[0];
        const verificado = speakeasy.totp.verify({
            secret: utilizador.two_factor_secret,
            encoding: 'base32',
            token: token
        });

        if (verificado) {
            // Se o código for válido, regista o acesso e faz o login final
            await gravarLogAcesso(utilizador.id, utilizador.nome);

            res.status(200).json({ 
                mensagem: 'Acesso validado!', 
                utilizador: { id: utilizador.id, nome: utilizador.nome, email: utilizador.email, tipo: utilizador.perfil } 
            });
        } else {
            res.status(401).json({ erro: 'Código inválido.' });
        }
    } catch (err) {
        console.error("Erro no 2FA:", err.message);
        res.status(500).json({ erro: 'Erro interno ao verificar o código.' });
    }
});

// ==========================================
// ROTAS PARA CONFIGURAR E ATIVAR O 2FA (GERA O QR CODE)
// ==========================================
app.post('/2fa/setup', async (req, res) => {
    const { id } = req.body;
    try {
        // Gera um segredo para a app Google Authenticator
        const secret = speakeasy.generateSecret({ name: "CyberLearn" });
        
        // Transforma o segredo num QR Code (imagem)
        QRCode.toDataURL(secret.otpauth_url, async (err, data_url) => {
            if (err) return res.status(500).json({ erro: 'Erro ao gerar QR Code.' });
            
            // Guarda o segredo de forma temporária na Base de Dados (mas ainda não ativa)
            await pool.query('UPDATE utilizadores SET two_factor_secret = $1 WHERE id = $2', [secret.base32, id]);
            
            res.status(200).json({ secret: secret.base32, qrCode: data_url });
        });
    } catch (err) { res.status(500).json({ erro: 'Erro interno ao configurar 2FA.' }); }
});

app.post('/2fa/enable', async (req, res) => {
    const { id, token } = req.body;
    try {
        const result = await pool.query('SELECT two_factor_secret FROM utilizadores WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });

        // Verifica se o primeiro código que o utilizador inseriu da app está correto
        const verificado = speakeasy.totp.verify({ secret: result.rows[0].two_factor_secret, encoding: 'base32', token: token });
        
        if (verificado) {
            // Se estiver correto, aí sim, ativamos oficialmente o 2FA para a conta dele
            await pool.query('UPDATE utilizadores SET two_factor_enabled = true WHERE id = $1', [id]);
            res.status(200).json({ mensagem: '2FA ativado com sucesso!' });
        } else {
            res.status(400).json({ erro: 'Código incorreto. Tenta novamente.' });
        }
    } catch (err) { res.status(500).json({ erro: 'Erro ao ativar 2FA.' }); }
});

// ==========================================
// ROTA DE RECUPERAR SENHA (ENVIO REAL DE EMAIL)
// ==========================================
app.post('/recuperar-senha', async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(200).json({ mensagem: 'Se o email existir, receberás um link de recuperação.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hora de validade

        await pool.query(
            'UPDATE utilizadores SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
            [resetToken, tokenExpiry, email]
        );

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"CyberLearn Suporte" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'CyberLearn - Recuperação de Palavra-Passe',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
                    <h2 style="color: #171f2f;">Recuperação de Palavra-Passe - CyberLearn 🛡️</h2>
                    <p style="color: #333;">Olá,</p>
                    <p style="color: #333;">Recebemos um pedido para repor a tua palavra-passe na plataforma CyberLearn.</p>
                    <p style="color: #333;">Clica no botão abaixo para escolheres uma nova palavra-passe (o link é válido por 1 hora):</p>
                    <a href="${resetLink}" style="padding: 12px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; font-weight: bold;">Criar Nova Palavra-Passe</a>
                    <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">Se não fizeste este pedido, podes simplesmente ignorar e apagar este email. A tua conta continua segura.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de recuperação enviado com sucesso para: ${email}`);

        res.status(200).json({ mensagem: 'Se o email existir, receberás um link de recuperação.' });

    } catch (err) {
        console.error("Erro na recuperação de senha:", err.message);
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

// ==========================================
// ROTA PARA ATUALIZAR A SENHA (COM O TOKEN)
// ==========================================
app.post('/reset-password', async (req, res) => {
    const { token, novaPassword } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM utilizadores WHERE reset_token = $1 AND reset_token_expiry > NOW()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ erro: 'O link de recuperação é inválido ou já expirou.' });
        }

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
    const { id, nome, senhaAtual, novaSenha } = req.body;

    try {
        const result = await pool.query('SELECT * FROM utilizadores WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Utilizador não encontrado.' });
        }

        const utilizador = result.rows[0];
        let newPasswordHash = utilizador.password_hash;

        if (novaSenha) {
            if (!senhaAtual) {
                return res.status(400).json({ erro: 'Precisas de inserir a senha atual para mudar a segurança.' });
            }
            
            const isValid = await bcrypt.compare(senhaAtual, utilizador.password_hash);
            if (!isValid) {
                return res.status(401).json({ erro: 'A palavra-passe atual está incorreta.' });
            }

            const salt = await bcrypt.genSalt(10);
            newPasswordHash = await bcrypt.hash(novaSenha, salt);
        }

        await pool.query(
            'UPDATE utilizadores SET nome = $1, password_hash = $2 WHERE id = $3',
            [nome, newPasswordHash, id]
        );

        res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });

    } catch (err) {
        console.error("Erro ao atualizar perfil:", err.message);
        res.status(500).json({ erro: 'Erro interno ao processar o pedido.' });
    }
});

// ==========================================
// ROTA PARA O PROFESSOR VER OS ACESSOS (SÓ ALUNOS)
// ==========================================
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
        
        console.log(`📡 Professor pediu lista de acessos. Total encontrados: ${result.rows.length}`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar acessos:", err.message);
        res.status(500).json({ erro: 'Erro interno ao carregar a tabela.' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT} e à escuta de pedidos!`);
});

// ==========================================
// ROTAS DE ADMINISTRAÇÃO (PROFESSORES)
// ==========================================

// 1. Obter a lista de todos os professores
app.get('/professores', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo 
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

// 2. Obter os logs de acesso (logins) exclusivamente dos professores
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

// 3. Eliminar um professor (e os seus cursos associados para não quebrar a base de dados)
// 3. Eliminar um professor (e todos os dados dependentes para evitar erros de Foreign Key)
app.delete('/professores/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1º Apagar os registos de login (logs de acesso) deste professor
        await pool.query('DELETE FROM logs_acesso WHERE utilizador_id = $1', [id]);

        // 2º Apagar as perguntas dos quizzes que pertencem aos cursos deste professor
        await pool.query(`
            DELETE FROM perguntas_quiz 
            WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE curso_id IN (SELECT id FROM cursos WHERE professor_id = $1)
            )
        `, [id]);

        // 3º Apagar os quizzes que pertencem aos cursos deste professor
        await pool.query(`
            DELETE FROM quizzes 
            WHERE curso_id IN (SELECT id FROM cursos WHERE professor_id = $1)
        `, [id]);

        // 4º Apagar os cursos criados pelo professor
        await pool.query('DELETE FROM cursos WHERE professor_id = $1', [id]);
        
        // 5º Por fim, apagar o próprio professor da tabela de utilizadores
        const result = await pool.query("DELETE FROM utilizadores WHERE id = $1 AND LOWER(TRIM(perfil)) = 'professor' RETURNING *", [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Professor não encontrado.' });
        res.status(200).json({ mensagem: 'Professor e todos os seus dados eliminados com sucesso!' });
    } catch (err) { 
        console.error("Erro fatal ao eliminar professor:", err);
        res.status(500).json({ erro: 'Erro interno ao tentar eliminar o professor.' }); 
    }
});
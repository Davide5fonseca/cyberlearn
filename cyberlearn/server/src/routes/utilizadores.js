const router = require('express').Router();
const { pool, comTransacao } = require('../config/db');
const { autenticar, exigirPerfil, proprioOuPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');

router.get('/alunos', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo,
               avatar, nivel_experiencia as "nivelExperiencia", area_interesse as interesse, biografia, github, linkedin
        FROM utilizadores
        WHERE LOWER(TRIM(perfil)) = 'aluno'
        ORDER BY nome ASC
    `);
    res.status(200).json(result.rows);
}, 'Erro interno ao carregar a lista de alunos.'));

router.get('/professores', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo,
               avatar, biografia_prof as "biografiaProf", metodologia
        FROM utilizadores
        WHERE LOWER(TRIM(perfil)) = 'professor'
        ORDER BY nome ASC
    `);
    res.status(200).json(result.rows);
}, 'Erro interno ao carregar a lista de professores.'));

router.get('/acessos', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT a.id, u.nome, u.email, u.avatar, to_char(a.data_hora_acesso, 'DD/MM/YYYY HH24:MI') as data
        FROM logs_acesso a
        JOIN utilizadores u ON a.utilizador_id = u.id
        WHERE LOWER(TRIM(u.perfil)) = 'aluno'
        ORDER BY a.data_hora_acesso DESC
        LIMIT 50
    `);
    res.status(200).json(result.rows);
}, 'Erro interno ao carregar a tabela.'));

router.get('/acessos-professores', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT a.id, u.nome, u.email, u.avatar, to_char(a.data_hora_acesso, 'DD/MM/YYYY HH24:MI') as data
        FROM logs_acesso a
        JOIN utilizadores u ON a.utilizador_id = u.id
        WHERE LOWER(TRIM(u.perfil)) = 'professor'
        ORDER BY a.data_hora_acesso DESC
        LIMIT 50
    `);
    res.status(200).json(result.rows);
}, 'Erro interno ao carregar os acessos dos professores.'));

router.get('/professor/alunos', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT id, nome, email, xp_total, avatar
        FROM utilizadores
        WHERE LOWER(TRIM(perfil)) = 'aluno'
        ORDER BY xp_total DESC NULLS LAST
    `);
    res.status(200).json(result.rows);
}, 'Erro ao carregar alunos.'));

router.get('/professor/aluno/:id/detalhes', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [userRes, trofeusRes, notasRes] = await Promise.all([
        pool.query(
            'SELECT biografia, nivel_experiencia, area_interesse, github, linkedin FROM utilizadores WHERE id = $1',
            [id]
        ),
        pool.query(`
            SELECT c.nome, c.icone, to_char(uc.data_obtencao, 'DD/MM/YYYY') as data
            FROM utilizador_conquistas uc
            JOIN conquistas_catalogo c ON uc.conquista_id = c.id
            WHERE uc.utilizador_id = $1
            ORDER BY uc.data_obtencao DESC
        `, [id]),
        pool.query(`
            SELECT quiz_titulo, acertos, total_perguntas, to_char(data_realizacao, 'DD/MM/YYYY HH24:MI') as data
            FROM tentativas_quizzes
            WHERE utilizador_id = $1
            ORDER BY data_realizacao DESC
        `, [id])
    ]);

    res.status(200).json({
        biografia: userRes.rows[0]?.biografia,
        nivel_experiencia: userRes.rows[0]?.nivel_experiencia,
        area_interesse: userRes.rows[0]?.area_interesse,
        github: userRes.rows[0]?.github,
        linkedin: userRes.rows[0]?.linkedin,
        trofeus: trofeusRes.rows,
        quizzes: notasRes.rows
    });
}, 'Erro ao carregar perfil.'));

router.delete('/utilizadores/:id', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    await comTransacao(async (client) => {
        await client.query('DELETE FROM resultados_quizzes WHERE utilizador_id = $1', [id]);
        await client.query('DELETE FROM tentativas_quizzes WHERE utilizador_id = $1', [id]);
        await client.query('DELETE FROM utilizador_conquistas WHERE utilizador_id = $1', [id]);
        await client.query('DELETE FROM logs_acesso WHERE utilizador_id = $1', [id]);
        await client.query('DELETE FROM utilizadores WHERE id = $1', [id]);
    });
    res.status(200).json({ mensagem: 'Utilizador eliminado com sucesso.' });
}, 'Erro ao eliminar utilizador da base de dados.'));

router.get('/professor/cursos/:id', autenticar, proprioOuPerfil('admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cursos WHERE professor_id = $1 ORDER BY id DESC', [id]);
    res.status(200).json(result.rows);
}, 'Erro ao carregar cursos do professor.'));

router.get('/professor/quizzes/:id', autenticar, proprioOuPerfil('admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(`
        SELECT q.*, g.id as grupo_id, g.aprovado as grupo_aprovado, c.titulo as nome_curso, c.nivel as nivel_curso
        FROM quizzes q
        JOIN quiz_grupos g ON q.grupo_id = g.id
        JOIN cursos c ON q.curso_id = c.id
        WHERE c.professor_id = $1
        ORDER BY q.id DESC
    `, [id]);
    res.status(200).json(result.rows);
}, 'Erro ao carregar quizzes do professor.'));

router.delete('/professores/:id', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await comTransacao(async (client) => {
        await client.query('DELETE FROM logs_acesso WHERE utilizador_id = $1', [id]);
        await client.query(`
            DELETE FROM quizzes
            WHERE curso_id IN (SELECT id FROM cursos WHERE professor_id = $1)
        `, [id]);
        await client.query('DELETE FROM cursos WHERE professor_id = $1', [id]);
        return client.query("DELETE FROM utilizadores WHERE id = $1 AND LOWER(TRIM(perfil)) = 'professor' RETURNING *", [id]);
    });
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.status(200).json({ mensagem: 'Professor e todos os seus dados eliminados com sucesso!' });
}, 'Erro interno ao tentar eliminar o professor.'));

module.exports = router;

const router = require('express').Router();
const { pool } = require('../config/db');
const { autenticar, exigirPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');
const { criarNotificacao } = require('../services/notificacoes');

router.get('/cursos', autenticar, asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT c.*, u.nome as nome_professor
        FROM cursos c
        LEFT JOIN utilizadores u ON c.professor_id = u.id
        WHERE c.aprovado = true
        ORDER BY c.id DESC
    `);
    res.status(200).json(result.rows);
}, 'Erro ao carregar os cursos.'));

router.post('/cursos', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { titulo, nivel, descricao, conteudo_licao } = req.body;
    // O autor é sempre o utilizador autenticado.
    const professor_id = req.user.id;

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
}, 'Erro interno ao criar o curso.'));

router.put('/cursos/:id', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { titulo, nivel, descricao, conteudo_licao } = req.body;
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
}, 'Erro interno ao atualizar o curso.'));

router.delete('/cursos/:id', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (req.user.perfil === 'professor') {
        const dono = await pool.query('SELECT professor_id FROM cursos WHERE id = $1', [id]);
        if (dono.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });
        if (dono.rows[0].professor_id !== req.user.id) return res.status(403).json({ erro: 'Só podes apagar os teus próprios cursos.' });
    }
    await pool.query('DELETE FROM quizzes WHERE curso_id = $1', [id]);
    await pool.query('DELETE FROM cursos WHERE id = $1', [id]);
    res.status(200).json({ mensagem: 'Curso apagado permanentemente!' });
}, 'Erro interno ao apagar o curso.'));

module.exports = router;

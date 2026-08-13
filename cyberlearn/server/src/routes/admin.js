const router = require('express').Router();
const { pool, comTransacao } = require('../config/db');
const { autenticar, exigirPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');
const { criarNotificacao } = require('../services/notificacoes');

router.get('/teste-bd', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensagem: 'Ligação ao PostgreSQL feita com sucesso!', tempo: result.rows[0] });
}, 'Falha na ligação à base de dados.'));

router.get('/admin/pendentes', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const [cursosRes, quizzesRes] = await Promise.all([
        pool.query(`
            SELECT c.*, u.nome as nome_professor
            FROM cursos c
            LEFT JOIN utilizadores u ON c.professor_id = u.id
            WHERE c.aprovado = false
            ORDER BY c.data_criacao DESC
        `),
        pool.query(`
            SELECT g.id as grupo_id, g.titulo, c.titulo as nome_curso, u.nome as nome_professor, COUNT(q.id) as num_perguntas
            FROM quiz_grupos g
            JOIN cursos c ON g.curso_id = c.id
            LEFT JOIN utilizadores u ON c.professor_id = u.id
            LEFT JOIN quizzes q ON q.grupo_id = g.id
            WHERE g.aprovado = false
            GROUP BY g.id, g.titulo, c.titulo, u.nome
            ORDER BY g.id DESC
        `)
    ]);

    res.status(200).json({ cursos: cursosRes.rows, quizzes: quizzesRes.rows });
}, 'Erro ao carregar pendentes.'));

router.put('/admin/aprovar/curso/:id', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const cursoRes = await pool.query('SELECT titulo, professor_id FROM cursos WHERE id = $1', [id]);

    if (cursoRes.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });

    const { titulo, professor_id } = cursoRes.rows[0];
    await pool.query('UPDATE cursos SET aprovado = true WHERE id = $1', [id]);

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

    res.status(200).json({ mensagem: 'Curso aprovado com sucesso!' });
}, 'Erro ao aprovar curso.'));

router.delete('/admin/rejeitar/curso/:id', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const cursoRes = await pool.query('SELECT titulo, professor_id FROM cursos WHERE id = $1', [id]);

    if (cursoRes.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });

    const { titulo, professor_id } = cursoRes.rows[0];

    await comTransacao(async (client) => {
        await client.query('DELETE FROM quizzes WHERE curso_id = $1', [id]);
        // comentarios_licao pode não existir em todos os ambientes:
        // usamos um savepoint para não abortar a transação se falhar.
        try {
            await client.query('SAVEPOINT sp_comentarios');
            await client.query('DELETE FROM comentarios_licao WHERE curso_id = $1', [id]);
        } catch {
            await client.query('ROLLBACK TO SAVEPOINT sp_comentarios');
        }
        await client.query('DELETE FROM cursos WHERE id = $1', [id]);
    });

    // Notificar Professor
    await criarNotificacao({
        utilizador_id: professor_id, icone: '❌', cor: '#ef4444',
        titulo: 'Curso Rejeitado',
        mensagem: `Infelizmente, o administrador não aprovou a publicação do teu curso "${titulo}". Ele foi removido.`,
        acao: 'professor_cursos'
    });

    res.status(200).json({ mensagem: 'Curso rejeitado e apagado.' });
}, 'Erro ao rejeitar curso.'));

router.put('/admin/aprovar/quiz/:grupoId', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    // Aprovação por id do grupo: não afeta quizzes homónimos de outros cursos.
    const grupoId = parseInt(req.params.grupoId, 10);

    const quizRes = await pool.query(`
        SELECT g.titulo, c.professor_id
        FROM quiz_grupos g
        JOIN cursos c ON g.curso_id = c.id
        WHERE g.id = $1
    `, [grupoId]);

    if (quizRes.rows.length === 0) return res.status(404).json({ erro: 'Quiz não encontrado na base de dados.' });

    const { titulo, professor_id: prof_id } = quizRes.rows[0];
    await pool.query('UPDATE quiz_grupos SET aprovado = true WHERE id = $1', [grupoId]);
    // Mantém a coluna legada das perguntas em sincronia.
    await pool.query('UPDATE quizzes SET aprovado = true WHERE grupo_id = $1', [grupoId]);

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

    res.status(200).json({ mensagem: 'Quiz aprovado com sucesso!' });
}, 'Erro ao aprovar quiz.'));

router.delete('/admin/rejeitar/quiz/:grupoId', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const grupoId = parseInt(req.params.grupoId, 10);

    const quizRes = await pool.query(`
        SELECT g.titulo, c.professor_id
        FROM quiz_grupos g
        JOIN cursos c ON g.curso_id = c.id
        WHERE g.id = $1
    `, [grupoId]);

    if (quizRes.rows.length === 0) return res.status(404).json({ erro: 'Quiz não encontrado.' });

    const { titulo, professor_id: prof_id } = quizRes.rows[0];

    // As perguntas caem em cascata; o histórico de tentativas é preservado
    // (quiz_grupo_id passa a NULL, as estatísticas agregam por utilizador).
    await pool.query('DELETE FROM quiz_grupos WHERE id = $1', [grupoId]);

    // Notificar Professor
    await criarNotificacao({
        utilizador_id: prof_id, icone: '❌', cor: '#ef4444',
        titulo: 'Quiz Rejeitado',
        mensagem: `O teu questionário para o tema "${titulo}" não passou na avaliação do sistema e foi removido.`,
        acao: 'professor_cursos'
    });

    res.status(200).json({ mensagem: 'Quiz rejeitado e apagado.' });
}, 'Erro ao rejeitar quiz.'));

module.exports = router;

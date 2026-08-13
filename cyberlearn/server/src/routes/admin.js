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
            SELECT q.titulo, c.titulo as nome_curso, u.nome as nome_professor, COUNT(q.id) as num_perguntas
            FROM quizzes q
            JOIN cursos c ON q.curso_id = c.id
            LEFT JOIN utilizadores u ON c.professor_id = u.id
            WHERE q.aprovado = false
            GROUP BY q.titulo, c.titulo, u.nome
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

router.put('/admin/aprovar/quiz', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    // Recebe o título em segurança pelo corpo da mensagem
    const { titulo } = req.body;

    const quizRes = await pool.query(`
        SELECT q.titulo, c.professor_id
        FROM quizzes q
        JOIN cursos c ON q.curso_id = c.id
        WHERE q.titulo = $1 LIMIT 1
    `, [titulo]);

    if (quizRes.rows.length === 0) return res.status(404).json({ erro: 'Quiz não encontrado na base de dados.' });

    const prof_id = quizRes.rows[0].professor_id;
    await pool.query('UPDATE quizzes SET aprovado = true WHERE titulo = $1', [titulo]);

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

router.post('/admin/rejeitar/quiz', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    // Usamos POST para garantir que o body chega intacto
    const { titulo } = req.body;

    const quizRes = await pool.query(`
        SELECT q.titulo, c.professor_id
        FROM quizzes q
        JOIN cursos c ON q.curso_id = c.id
        WHERE q.titulo = $1 LIMIT 1
    `, [titulo]);

    if (quizRes.rows.length === 0) return res.status(404).json({ erro: 'Quiz não encontrado.' });

    const prof_id = quizRes.rows[0].professor_id;

    // Apaga as tentativas do quiz antes de apagar o quiz em si
    await pool.query('DELETE FROM tentativas_quizzes WHERE quiz_titulo = $1', [titulo]).catch(() => console.log('Sem tentativas.'));
    await pool.query('DELETE FROM quizzes WHERE titulo = $1', [titulo]);

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

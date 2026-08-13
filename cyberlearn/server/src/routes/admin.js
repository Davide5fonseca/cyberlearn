const router = require('express').Router();
const { pool, comTransacao } = require('../config/db');
const { autenticar, exigirPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');
const { criarNotificacao } = require('../services/notificacoes');
const { enviarBoasVindasProfessor } = require('../config/mailer');

router.get('/teste-bd', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensagem: 'Ligação ao PostgreSQL feita com sucesso!', tempo: result.rows[0] });
}, 'Falha na ligação à base de dados.'));

router.get('/admin/pendentes', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const [cursosRes, quizzesRes, professoresRes] = await Promise.all([
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
        `),
        pool.query(`
            SELECT id, nome, email, to_char(data_registo, 'DD/MM/YYYY') as data_registo
            FROM utilizadores
            WHERE LOWER(TRIM(perfil)) = 'professor' AND ativo = false
            ORDER BY data_registo DESC
        `)
    ]);

    res.status(200).json({ cursos: cursosRes.rows, quizzes: quizzesRes.rows, professores: professoresRes.rows });
}, 'Erro ao carregar pendentes.'));

router.put('/admin/aprovar/professor/:id', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(
        "UPDATE utilizadores SET ativo = true WHERE id = $1 AND LOWER(TRIM(perfil)) = 'professor' RETURNING id, nome, email",
        [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Professor não encontrado.' });

    const professor = result.rows[0];
    await criarNotificacao({
        utilizador_id: professor.id, icone: '✅', cor: '#10b981',
        titulo: 'Conta Aprovada!',
        mensagem: 'A tua conta de professor foi aprovada. Bem-vindo ao CyberLearn!',
        acao: 'professor_dashboard'
    });
    // O email de boas-vindas é acessório: uma falha de envio não anula a aprovação.
    try { await enviarBoasVindasProfessor(professor); } catch (err) { console.error('⚠️ Falha no email de boas-vindas:', err.message); }

    res.status(200).json({ mensagem: `Professor ${professor.nome} aprovado com sucesso!` });
}, 'Erro ao aprovar professor.'));

router.delete('/admin/rejeitar/professor/:id', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    // Só remove contas de professor ainda não aprovadas (as ativas saem por /professores/:id).
    const result = await pool.query(
        "DELETE FROM utilizadores WHERE id = $1 AND LOWER(TRIM(perfil)) = 'professor' AND ativo = false RETURNING id",
        [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Professor pendente não encontrado.' });
    res.status(200).json({ mensagem: 'Registo de professor rejeitado e removido.' });
}, 'Erro ao rejeitar professor.'));

// A tabela logs_seguranca sempre foi escrita (login_falha, 2fa_falha,
// login_sucesso) mas nunca lida — este ecrã rentabiliza esses dados.
router.get('/admin/logs-seguranca', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const tiposValidos = ['login_falha', '2fa_falha', 'login_sucesso'];
    const tipo = tiposValidos.includes(req.query.tipo) ? req.query.tipo : null;
    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 0);

    const filtro = tipo ? 'WHERE l.tipo = $2' : '';
    const params = tipo ? [limite, tipo, (pagina - 1) * limite] : [limite, (pagina - 1) * limite];
    const offsetParam = tipo ? '$3' : '$2';

    const result = await pool.query(`
        SELECT l.id, l.tipo, l.email, l.ip, u.nome,
               to_char(l.data_criacao, 'DD/MM/YYYY HH24:MI') as data
        FROM logs_seguranca l
        LEFT JOIN utilizadores u ON l.utilizador_id = u.id
        ${filtro}
        ORDER BY l.data_criacao DESC
        LIMIT $1 OFFSET ${offsetParam}
    `, params);

    res.status(200).json(result.rows);
}, 'Erro ao carregar os registos de segurança.'));

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

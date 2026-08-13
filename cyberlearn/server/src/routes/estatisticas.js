const router = require('express').Router();
const { pool } = require('../config/db');
const { autenticar, exigirPerfil, proprioOuPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');

router.get('/estatisticas/aluno/:id', autenticar, proprioOuPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Queries independentes em paralelo: 1 round-trip de latência em vez de 5.
    const [userRes, trofeusRes, logsRes, acertosRes, cursosRes] = await Promise.all([
        pool.query('SELECT xp_total FROM utilizadores WHERE id = $1', [id]),
        pool.query('SELECT COUNT(*) FROM utilizador_conquistas WHERE utilizador_id = $1', [id]),
        pool.query('SELECT COUNT(DISTINCT DATE(data_hora_acesso)) FROM logs_acesso WHERE utilizador_id = $1', [id]),
        // Taxa de acerto real: total de respostas certas / total de perguntas respondidas.
        pool.query(
            'SELECT COALESCE(SUM(acertos), 0) AS certos, COALESCE(SUM(total_perguntas), 0) AS total FROM tentativas_quizzes WHERE utilizador_id = $1',
            [id]
        ),
        pool.query('SELECT * FROM cursos WHERE aprovado = true ORDER BY data_criacao DESC LIMIT 4')
    ]);

    const xpTotal = userRes.rows[0]?.xp_total || 0;
    const modulosConcluidos = parseInt(trofeusRes.rows[0].count);
    const diasSeguidos = parseInt(logsRes.rows[0].count);

    const totalRespostas = parseInt(acertosRes.rows[0].total);
    const totalCertas = parseInt(acertosRes.rows[0].certos);
    const taxaAcerto = totalRespostas > 0 ? Math.round((totalCertas / totalRespostas) * 100) : 0;

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
        stats: { modulosConcluidos, pontuacaoTotal: xpTotal, taxaAcerto, diasSeguidos },
        cursoDestaque, cursosAtivos
    });
}, 'Erro ao carregar dados do dashboard.'));

router.get('/admin-estatisticas', autenticar, exigirPerfil('admin'), asyncHandler(async (req, res) => {
    const [profsResult, sessoesResult, acessosResult] = await Promise.all([
        pool.query("SELECT COUNT(*) FROM utilizadores WHERE LOWER(TRIM(perfil)) = 'professor'"),
        pool.query("SELECT COUNT(DISTINCT utilizador_id) FROM logs_acesso WHERE data_hora_acesso >= NOW() - INTERVAL '24 hours'"),
        pool.query('SELECT COUNT(*) FROM logs_acesso')
    ]);

    res.status(200).json({
        professoresAtivos: parseInt(profsResult.rows[0].count),
        sessoesAtivas: parseInt(sessoesResult.rows[0].count),
        totalAcessos: parseInt(acessosResult.rows[0].count),
        cargaSistema: 0
    });
}, 'Erro ao carregar estatísticas.'));

router.get('/estatisticas/aluno/:id/atividades', autenticar, proprioOuPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [quizzesRes, conquistasRes] = await Promise.all([
        pool.query(`
            SELECT quiz_titulo as titulo, to_char(data_realizacao, 'YYYY-MM-DD') as data, 'Quiz' as tipo
            FROM tentativas_quizzes
            WHERE utilizador_id = $1
        `, [id]),
        pool.query(`
            SELECT c.nome as titulo, to_char(uc.data_obtencao, 'YYYY-MM-DD') as data, 'Módulo/Troféu' as tipo
            FROM utilizador_conquistas uc
            JOIN conquistas_catalogo c ON uc.conquista_id = c.id
            WHERE uc.utilizador_id = $1
        `, [id])
    ]);

    const atividades = [...quizzesRes.rows, ...conquistasRes.rows];
    res.status(200).json(atividades);
}, 'Erro ao carregar calendário.'));

module.exports = router;

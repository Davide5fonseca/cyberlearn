const router = require('express').Router();
const { pool, comTransacao } = require('../config/db');
const { autenticar, exigirPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');
const { criarNotificacao } = require('../services/notificacoes');
const { corrigirSubmissao } = require('../services/scoring');
const { validar, quizSchema, submeterQuizSchema } = require('../validacao/schemas');

// Lista de avaliações aprovadas, agrupadas por avaliação.
// ⚠️ Nunca inclui resposta_correta: a correção é feita no servidor.
router.get('/quizzes', autenticar, asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT g.id AS grupo_id, g.titulo, c.titulo AS nome_curso, c.nivel AS nivel_curso,
               q.id AS pergunta_id, q.pergunta, q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d
        FROM quiz_grupos g
        JOIN cursos c ON g.curso_id = c.id
        JOIN quizzes q ON q.grupo_id = g.id
        WHERE g.aprovado = true
        ORDER BY g.id DESC, q.id ASC
    `);

    const grupos = new Map();
    for (const row of result.rows) {
        if (!grupos.has(row.grupo_id)) {
            grupos.set(row.grupo_id, {
                grupoId: row.grupo_id,
                titulo: row.titulo,
                nome_curso: row.nome_curso,
                nivel_curso: row.nivel_curso,
                perguntas: []
            });
        }
        const opcoes = [
            { letra: 'A', texto: row.opcao_a },
            { letra: 'B', texto: row.opcao_b },
            { letra: 'C', texto: row.opcao_c },
            { letra: 'D', texto: row.opcao_d }
        ].filter(o => o.texto && String(o.texto).trim() !== '');
        grupos.get(row.grupo_id).perguntas.push({ id: row.pergunta_id, pergunta: row.pergunta, opcoes });
    }

    res.status(200).json([...grupos.values()]);
}, 'Erro ao carregar as avaliações.'));

// Submissão de respostas: o servidor corrige, grava a tentativa,
// credita XP e atribui conquistas. O cliente só envia as opções escolhidas.
router.post('/quizzes/:grupoId/submeter', autenticar, validar(submeterQuizSchema), asyncHandler(async (req, res) => {
    const grupoId = parseInt(req.params.grupoId, 10);
    if (!Number.isInteger(grupoId) || grupoId <= 0) return res.status(400).json({ erro: 'Avaliação inválida.' });

    const resultado = await corrigirSubmissao({
        grupoId,
        respostas: req.body.respostas,
        utilizadorId: req.user.id
    });

    if (!resultado) return res.status(404).json({ erro: 'Avaliação não encontrada ou ainda não aprovada.' });
    res.status(200).json(resultado);
}, 'Erro ao submeter a avaliação.'));

router.post('/quizzes', autenticar, exigirPerfil('professor', 'admin'), validar(quizSchema), asyncHandler(async (req, res) => {
    const { titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta } = req.body;
    // Um professor só pode adicionar perguntas a cursos seus.
    if (req.user.perfil === 'professor') {
        const dono = await pool.query('SELECT professor_id FROM cursos WHERE id = $1', [curso_id]);
        if (dono.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });
        if (dono.rows[0].professor_id !== req.user.id) return res.status(403).json({ erro: 'Só podes criar quizzes para os teus próprios cursos.' });
    }

    await comTransacao(async (client) => {
        const existente = await client.query(
            'SELECT id FROM quiz_grupos WHERE titulo = $1 AND curso_id = $2',
            [titulo, curso_id]
        );
        let grupoId;
        if (existente.rows.length > 0) {
            grupoId = existente.rows[0].id;
            // Conteúdo novo volta a precisar de aprovação do admin.
            await client.query('UPDATE quiz_grupos SET aprovado = false WHERE id = $1', [grupoId]);
        } else {
            const novo = await client.query(
                'INSERT INTO quiz_grupos (titulo, curso_id) VALUES ($1, $2) RETURNING id',
                [titulo, curso_id]
            );
            grupoId = novo.rows[0].id;
        }
        await client.query(
            'INSERT INTO quizzes (titulo, curso_id, grupo_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [titulo, curso_id, grupoId, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta]
        );
    });

    // NOTIFICAR O ADMINISTRADOR
    await criarNotificacao({
        perfil_alvo: 'admin',
        icone: '⏳', cor: '#f59e0b',
        titulo: 'Quiz a Aguardar Aprovação',
        mensagem: `O questionário do tema "${titulo}" precisa de autorização para ser publicado.`,
        acao: 'admin_aprovacoes'
    });

    res.status(201).json({ mensagem: 'Avaliação adicionada e a aguardar aprovação!' });
}, 'Erro ao guardar a avaliação na base de dados.'));

router.delete('/quizzes/:grupoId', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const grupoId = parseInt(req.params.grupoId, 10);
    if (!Number.isInteger(grupoId) || grupoId <= 0) return res.status(400).json({ erro: 'Avaliação inválida.' });

    const grupoRes = await pool.query(`
        SELECT g.id, c.professor_id
        FROM quiz_grupos g
        JOIN cursos c ON g.curso_id = c.id
        WHERE g.id = $1
    `, [grupoId]);
    if (grupoRes.rows.length === 0) return res.status(404).json({ erro: 'Avaliação não encontrada.' });
    if (req.user.perfil === 'professor' && grupoRes.rows[0].professor_id !== req.user.id) {
        return res.status(403).json({ erro: 'Só podes apagar quizzes dos teus próprios cursos.' });
    }

    // As perguntas caem em cascata; as tentativas ficam no histórico (quiz_grupo_id = NULL).
    await pool.query('DELETE FROM quiz_grupos WHERE id = $1', [grupoId]);
    res.status(200).json({ mensagem: 'Avaliação apagada permanentemente!' });
}, 'Erro interno ao apagar o quiz.'));

module.exports = router;

const router = require('express').Router();
const { pool } = require('../config/db');
const { autenticar, exigirPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');
const { criarNotificacao } = require('../services/notificacoes');

router.get('/quizzes', autenticar, asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT q.*, c.titulo as nome_curso, c.nivel as nivel_curso
        FROM quizzes q
        JOIN cursos c ON q.curso_id = c.id
        WHERE q.aprovado = true
        ORDER BY q.id DESC
    `);
    res.status(200).json(result.rows);
}, 'Erro ao carregar as avaliações.'));

router.post('/quizzes', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta } = req.body;
    // Um professor só pode adicionar perguntas a cursos seus.
    if (req.user.perfil === 'professor') {
        const dono = await pool.query('SELECT professor_id FROM cursos WHERE id = $1', [curso_id]);
        if (dono.rows.length === 0) return res.status(404).json({ erro: 'Curso não encontrado.' });
        if (dono.rows[0].professor_id !== req.user.id) return res.status(403).json({ erro: 'Só podes criar quizzes para os teus próprios cursos.' });
    }
    await pool.query(
        'INSERT INTO quizzes (titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [titulo, curso_id, pergunta, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta]
    );

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

router.delete('/quizzes/:titulo', autenticar, exigirPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { titulo } = req.params;
    if (req.user.perfil === 'professor') {
        const donos = await pool.query(
            'SELECT DISTINCT c.professor_id FROM quizzes q JOIN cursos c ON q.curso_id = c.id WHERE q.titulo = $1',
            [titulo]
        );
        const alheio = donos.rows.some(r => r.professor_id !== req.user.id);
        if (donos.rows.length === 0 || alheio) {
            return res.status(403).json({ erro: 'Só podes apagar quizzes dos teus próprios cursos.' });
        }
    }
    await pool.query('DELETE FROM quizzes WHERE titulo = $1', [titulo]);
    res.status(200).json({ mensagem: 'Avaliação apagada permanentemente!' });
}, 'Erro interno ao apagar o quiz.'));

router.post('/quizzes/salvar-resultado', autenticar, asyncHandler(async (req, res) => {
    const { quizTitulo, acertos, totalPerguntas } = req.body;
    const utilizadorId = req.user.id;
    await pool.query(
        'INSERT INTO tentativas_quizzes (utilizador_id, quiz_titulo, acertos, total_perguntas) VALUES ($1, $2, $3, $4)',
        [utilizadorId, quizTitulo, acertos, totalPerguntas]
    );
    res.status(200).json({ mensagem: 'Resultado salvo com sucesso!' });
}, 'Erro ao salvar resultado.'));

module.exports = router;

const router = require('express').Router();
const { pool } = require('../config/db');
const { autenticar, proprioOuPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');
const { validar, atribuirConquistaSchema, adicionarXpSchema } = require('../validacao/schemas');

router.get('/conquistas/:utilizadorId', autenticar, proprioOuPerfil('professor', 'admin'), asyncHandler(async (req, res) => {
    const { utilizadorId } = req.params;
    const result = await pool.query(`
        SELECT c.nome, c.descricao, c.icone, to_char(uc.data_obtencao, 'DD/MM/YYYY') as data
        FROM utilizador_conquistas uc
        JOIN conquistas_catalogo c ON uc.conquista_id = c.id
        WHERE uc.utilizador_id = $1
        ORDER BY uc.data_obtencao DESC
    `, [utilizadorId]);
    res.status(200).json(result.rows);
}, 'Erro ao carregar conquistas.'));

router.post('/conquistas/atribuir', autenticar, validar(atribuirConquistaSchema), asyncHandler(async (req, res) => {
    const { nomeConquista } = req.body;
    const utilizadorId = req.user.id;
    const conquistaRes = await pool.query('SELECT id FROM conquistas_catalogo WHERE nome = $1', [nomeConquista]);
    if (conquistaRes.rows.length === 0) return res.status(404).json({ erro: 'Troféu não existe no catálogo.' });

    const conquistaId = conquistaRes.rows[0].id;
    await pool.query(`
        INSERT INTO utilizador_conquistas (utilizador_id, conquista_id)
        VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [utilizadorId, conquistaId]);

    res.status(200).json({ mensagem: 'Troféu validado com sucesso!' });
}, 'Erro ao atribuir conquista.'));

router.post('/xp/adicionar', autenticar, validar(adicionarXpSchema), asyncHandler(async (req, res) => {
    const { quantidade } = req.body;
    const utilizadorId = req.user.id;
    // Limita a quantidade de XP por pedido para evitar abusos.
    const xp = Math.max(0, Math.min(parseInt(quantidade, 10) || 0, 100));
    const result = await pool.query(
        'UPDATE utilizadores SET xp_total = xp_total + $1 WHERE id = $2 RETURNING xp_total',
        [xp, utilizadorId]
    );
    res.status(200).json({ mensagem: 'XP Adicionado', xp_total: result.rows[0].xp_total });
}, 'Erro ao adicionar pontos de experiência.'));

router.get('/classificacao', autenticar, asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT id, nome, avatar, xp_total
        FROM utilizadores
        WHERE LOWER(TRIM(perfil)) = 'aluno'
        ORDER BY xp_total DESC NULLS LAST
        LIMIT 10
    `);
    res.status(200).json(result.rows);
}, 'Erro ao carregar a classificação.'));

module.exports = router;

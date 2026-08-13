const router = require('express').Router();
const { pool } = require('../config/db');
const { autenticar, proprioOuPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');

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

// NOTA: as antigas rotas POST /conquistas/atribuir e POST /xp/adicionar foram
// removidas — o XP e as conquistas são agora atribuídos exclusivamente pelo
// servidor ao corrigir submissões de quizzes (services/scoring.js).

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

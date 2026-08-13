const router = require('express').Router();
const { pool } = require('../config/db');
const { autenticar, proprioOuPerfil } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errors');

router.get('/notificacoes/:id', autenticar, proprioOuPerfil('admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRes = await pool.query('SELECT perfil FROM utilizadores WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });

    const perfil = userRes.rows[0].perfil.toLowerCase().trim();
    let notificacoes = [];

    // 1. Notificações Persistentes do Sistema (Aprovações, Rejeições, Pedidos Admin, etc)
    const dbNotifsRes = await pool.query(`
        SELECT id, icone, cor, titulo, mensagem, to_char(data_criacao, 'DD/MM/YYYY') as data, acao
        FROM notificacoes_sistema
        WHERE utilizador_id = $1::INTEGER OR perfil_alvo = $2
        ORDER BY data_criacao DESC
        LIMIT 15
    `, [id, perfil]);

    const notificacoesSistema = dbNotifsRes.rows.map(n => ({
        id: `sys_${n.id}`,
        icone: n.icone,
        cor: n.cor,
        titulo: n.titulo,
        mensagem: n.mensagem,
        data: n.data,
        acao: n.acao,
        labelAcao: 'Aceder →'
    }));

    notificacoes = [...notificacoesSistema];

    // 2. Notificações Dinâmicas (Específicas de Aluno)
    if (perfil === 'aluno') {
        const trofeusRes = await pool.query(`
            SELECT c.nome, c.icone, to_char(uc.data_obtencao, 'DD/MM/YYYY') as data
            FROM utilizador_conquistas uc
            JOIN conquistas_catalogo c ON uc.conquista_id = c.id
            WHERE uc.utilizador_id = $1
            ORDER BY uc.data_obtencao DESC
            LIMIT 3
        `, [id]);

        const notificacoesTrofeus = trofeusRes.rows.map(t => ({
            id: `trofeu_${t.nome}`,
            icone: t.icone || '🏆',
            cor: '#f59e0b',
            titulo: 'Nova Medalha Desbloqueada!',
            mensagem: `Desbloqueaste o troféu: ${t.nome}`,
            data: t.data,
            acao: 'profile',
            labelAcao: 'Ver Perfil →'
        }));
        notificacoes = [...notificacoes, ...notificacoesTrofeus];

        const comentariosRes = await pool.query(`
            SELECT cl.curso_id, c.titulo as nome_curso, cl.nome_utilizador,
                   to_char(cl.data_criacao, 'DD/MM/YYYY') as data
            FROM comentarios_licao cl
            JOIN cursos c ON cl.curso_id = c.id
            WHERE cl.utilizador_id != $1
            ORDER BY cl.data_criacao DESC
            LIMIT 2
        `, [id]);
        const notificacoesComentarios = comentariosRes.rows.map((c, i) => ({
            id: `comentario_${c.curso_id}_${i}`,
            icone: '💬',
            cor: '#10b981',
            titulo: 'Novo Comentário na Lição',
            mensagem: `${c.nome_utilizador} comentou em "${c.nome_curso}".`,
            data: c.data,
            acao: 'cursos',
            cursoId: c.curso_id,
            labelAcao: 'Ver Lição →'
        }));
        notificacoes = [...notificacoes, ...notificacoesComentarios];
    }

    res.status(200).json(notificacoes.slice(0, 10));
}, 'Erro ao carregar notificações.'));

module.exports = router;

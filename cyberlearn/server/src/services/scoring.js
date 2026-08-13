const { pool, comTransacao } = require('../config/db');

// Escalões de XP por percentagem de acerto (antes viviam no cliente e eram falsificáveis).
const xpPorPercentagem = (pct) => {
    if (pct === 100) return 100;
    if (pct >= 80) return 75;
    if (pct >= 50) return 50;
    return 10;
};

// Conquistas elegíveis para um resultado de quiz.
const conquistasPorPercentagem = (pct) => {
    const nomes = ['Primeiro Sangue'];
    if (pct >= 50) nomes.push('Escudo Ativo');
    if (pct === 100) nomes.push('Hacker Perfeito');
    return nomes;
};

// Corrige uma submissão: compara as respostas com a BD, grava a tentativa,
// credita XP e atribui conquistas — tudo numa transação.
// Devolve null se o grupo não existir ou não estiver aprovado.
const corrigirSubmissao = async ({ grupoId, respostas, utilizadorId }) => {
    const perguntasRes = await pool.query(`
        SELECT q.id, q.resposta_correta, g.titulo
        FROM quizzes q
        JOIN quiz_grupos g ON q.grupo_id = g.id
        WHERE g.id = $1 AND g.aprovado = true
    `, [grupoId]);
    if (perguntasRes.rows.length === 0) return null;

    const titulo = perguntasRes.rows[0].titulo;
    const total = perguntasRes.rows.length;

    const respostaDada = new Map(
        respostas.map(r => [Number(r.perguntaId), String(r.opcao || '').toLowerCase().trim()])
    );

    let acertos = 0;
    const corrigidas = [];
    for (const row of perguntasRes.rows) {
        const correta = String(row.resposta_correta || '').toLowerCase().trim();
        const dada = respostaDada.get(row.id) ?? null;
        const acertou = dada !== null && dada === correta;
        if (acertou) acertos++;
        corrigidas.push({ perguntaId: row.id, correta: correta.toUpperCase(), dada: dada ? dada.toUpperCase() : null, acertou });
    }

    const percentagem = (acertos / total) * 100;
    const xpGanho = xpPorPercentagem(percentagem);

    return comTransacao(async (client) => {
        await client.query(
            'INSERT INTO tentativas_quizzes (utilizador_id, quiz_titulo, acertos, total_perguntas, quiz_grupo_id) VALUES ($1, $2, $3, $4, $5)',
            [utilizadorId, titulo, acertos, total, grupoId]
        );

        const xpRes = await client.query(
            'UPDATE utilizadores SET xp_total = COALESCE(xp_total, 0) + $1 WHERE id = $2 RETURNING xp_total',
            [xpGanho, utilizadorId]
        );

        const conquistasNovas = [];
        for (const nome of conquistasPorPercentagem(percentagem)) {
            const cat = await client.query('SELECT id, nome, icone FROM conquistas_catalogo WHERE nome = $1', [nome]);
            if (cat.rows.length === 0) continue;
            const ins = await client.query(
                'INSERT INTO utilizador_conquistas (utilizador_id, conquista_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING conquista_id',
                [utilizadorId, cat.rows[0].id]
            );
            if (ins.rows.length > 0) conquistasNovas.push({ nome: cat.rows[0].nome, icone: cat.rows[0].icone });
        }

        return {
            acertos, total, percentagem: Math.round(percentagem), xpGanho,
            xpTotal: xpRes.rows[0]?.xp_total ?? null,
            conquistasNovas, corrigidas
        };
    });
};

module.exports = { xpPorPercentagem, conquistasPorPercentagem, corrigirSubmissao };

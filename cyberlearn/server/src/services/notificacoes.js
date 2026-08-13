const { pool } = require('../config/db');

// Cria uma notificação persistente, dirigida a um utilizador ou a um perfil inteiro.
const criarNotificacao = async ({ utilizador_id = null, perfil_alvo = null, icone, cor, titulo, mensagem, acao }) => {
    try {
        await pool.query(
            'INSERT INTO notificacoes_sistema (utilizador_id, perfil_alvo, icone, cor, titulo, mensagem, acao) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [utilizador_id, perfil_alvo, icone, cor, titulo, mensagem, acao]
        );
        console.log(`🔔 Notificação criada para [${perfil_alvo || utilizador_id}]: ${titulo}`);
    } catch (err) {
        console.error('❌ Erro ao injetar notificação:', err.message);
    }
};

module.exports = { criarNotificacao };

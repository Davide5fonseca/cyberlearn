const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    // Com DB_CA_CERT validamos o certificado do servidor; sem ele mantemos a ligação
    // cifrada mas sem validação (limitação do fornecedor atual — ver README).
    ssl: process.env.DB_CA_CERT
        ? { rejectUnauthorized: true, ca: process.env.DB_CA_CERT }
        : { rejectUnauthorized: false },
    // Limites adequados a serverless: cada instância segura poucas ligações.
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
});

pool.on('error', (err) => console.error('❌ Erro inesperado no pool de ligações:', err.message));

// Executa uma função dentro de uma transação. Faz COMMIT no sucesso e
// ROLLBACK em caso de erro, garantindo que os cascades não ficam a meio.
const comTransacao = async (fn) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultado = await fn(client);
        await client.query('COMMIT');
        return resultado;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { pool, comTransacao };

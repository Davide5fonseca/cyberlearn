const app = require('./src/app');
const { PORT } = require('./src/config/env');

// Erros fora do ciclo HTTP (pool, email) ficam registados antes de derrubar o processo.
process.on('unhandledRejection', (err) => console.error('❌ unhandledRejection:', err));
process.on('uncaughtException', (err) => {
    console.error('❌ uncaughtException:', err);
    process.exit(1);
});

// Exportar a app permite testes com supertest e é o padrão esperado pelo @vercel/node.
// O listen só corre quando o ficheiro é executado diretamente (npm run dev / start).
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor a correr na porta ${PORT}`);
    });
}

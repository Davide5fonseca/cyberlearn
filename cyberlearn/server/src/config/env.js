require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET não está definido no ambiente. Por segurança, o servidor não vai arrancar.');
    process.exit(1);
}

// Apenas as origens declaradas em FRONTEND_ORIGINS podem chamar a API.
const origensPermitidas = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
    .split(',').map(o => o.trim()).filter(Boolean);

module.exports = {
    JWT_SECRET,
    origensPermitidas,
    PORT: process.env.PORT || 3000
};

const rateLimit = require('express-rate-limit');

// Limita tentativas em rotas sensíveis de autenticação (anti brute-force).
const limiterAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Demasiadas tentativas. Por favor aguarda alguns minutos e tenta novamente.' }
});

// Limite global de pedidos (as rotas de autenticação têm o limiterAuth, mais apertado).
const limiterGlobal = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Demasiados pedidos. Tenta novamente dentro de instantes.' }
});

module.exports = { limiterAuth, limiterGlobal };

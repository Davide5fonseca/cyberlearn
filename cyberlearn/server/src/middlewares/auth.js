const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const gerarToken = (u) => jwt.sign(
    { id: u.id, perfil: (u.perfil || '').toLowerCase().trim(), nome: u.nome, email: u.email },
    JWT_SECRET,
    { expiresIn: '12h' }
);

// Exige um token válido. Preenche req.user = { id, perfil, nome, email }.
const autenticar = (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ erro: 'Autenticação necessária.' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ erro: 'Sessão inválida ou expirada. Volta a iniciar sessão.' });
    }
};

// Exige que o perfil do utilizador esteja na lista permitida.
const exigirPerfil = (...perfis) => (req, res, next) => {
    if (!req.user || !perfis.includes(req.user.perfil)) {
        return res.status(403).json({ erro: 'Não tens permissão para realizar esta ação.' });
    }
    next();
};

// Permite o próprio utilizador (id no URL) OU um dos perfis elevados indicados.
const proprioOuPerfil = (...perfis) => (req, res, next) => {
    const alvo = parseInt(req.params.id ?? req.params.utilizadorId, 10);
    if (req.user && (req.user.id === alvo || perfis.includes(req.user.perfil))) return next();
    return res.status(403).json({ erro: 'Não tens permissão para aceder a estes dados.' });
};

module.exports = { gerarToken, autenticar, exigirPerfil, proprioOuPerfil };

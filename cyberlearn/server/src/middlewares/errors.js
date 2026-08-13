// Envolve um handler assíncrono: qualquer erro segue para o middleware final,
// com uma mensagem pública específica da rota (o detalhe fica só nos logs).
const asyncHandler = (fn, mensagemPublica = 'Erro interno do servidor.') => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch((err) => {
        if (!err.mensagemPublica) err.mensagemPublica = mensagemPublica;
        next(err);
    });

// Middleware de erro final: regista o erro completo e devolve apenas a mensagem pública.
const errorHandler = (err, req, res, next) => {
    console.error(`❌ [${req.method} ${req.originalUrl}]`, err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ erro: err.mensagemPublica || 'Erro interno do servidor.' });
};

module.exports = { asyncHandler, errorHandler };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { origensPermitidas } = require('./config/env');
const { limiterGlobal } = require('./middlewares/rateLimit');
const { errorHandler } = require('./middlewares/errors');

const app = express();

// Necessário atrás de um proxy (Vercel) para ler o IP real e para o rate-limit.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(limiterGlobal);

app.use(require('./routes/auth'));
app.use(require('./routes/cursos'));
app.use(require('./routes/quizzes'));
app.use(require('./routes/gamificacao'));
app.use(require('./routes/estatisticas'));
app.use(require('./routes/utilizadores'));
app.use(require('./routes/notificacoes'));
app.use(require('./routes/admin'));

// Handler de erros: tem de ser o último middleware registado.
app.use(errorHandler);

module.exports = app;

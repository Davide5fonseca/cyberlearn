# 🛡️ CyberLearn

Plataforma de e-learning de cibersegurança com cursos, lições, quizzes e gamificação.
Suporta três perfis de utilizador — **Aluno**, **Professor** e **Administrador** — cada um com o seu painel e permissões.

---

## ✨ Funcionalidades

### Aluno
- Catálogo de cursos e lições aprovadas
- Quizzes de avaliação **corrigidos no servidor** (o cliente nunca recebe as respostas certas)
- Gamificação: XP, troféus/conquistas, *streaks* de login e classificação (ranking) — atribuídos exclusivamente pelo servidor
- Dashboard com estatísticas reais (taxa de acerto, dias seguidos, conquistas)
- Centro de notificações

### Professor
- Registo sujeito a **aprovação do administrador** antes do primeiro acesso
- Criação, edição e remoção dos seus próprios cursos e quizzes
- Conteúdos enviados ficam a aguardar aprovação do administrador
- Acompanhamento do progresso e notas dos alunos, exportação PDF

### Administrador
- Aprovação/rejeição de professores, cursos e quizzes pendentes
- Gestão de professores e utilizadores
- Estatísticas globais da plataforma e histórico de acessos
- **Registos de segurança**: auditoria de logins, falhas de password e de 2FA, com filtro por tipo

### Transversal
- Interface em **Português e Inglês** (seletor no cabeçalho, preferência guardada)
- Modo claro/escuro
- Navegação acessível por teclado (botões reais, labels ligadas, `aria-*`)

---

## 🧱 Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, Vite, react-router-dom |
| Backend | Node.js, Express 5 |
| Base de dados | PostgreSQL (`pg`) |
| Autenticação | JWT, 2FA por email (Nodemailer), `bcrypt` |
| Validação | `zod` (todas as rotas com corpo) |
| Segurança | `helmet`, CORS restrito, `express-rate-limit`, autorização por perfil |
| Testes | Jest + Supertest (API), Vitest + Testing Library (UI) |
| Deploy | Vercel |

---

## 📁 Estrutura

```
cyberlearn/
├── package.json                 # scripts de orquestração (raiz)
└── cyberlearn/
    ├── frontend/                # aplicação React + Vite
    │   └── src/
    │       ├── api.js           # cliente HTTP (token JWT, tratamento de 401)
    │       ├── App.jsx          # rotas (react-router) e rotas protegidas por perfil
    │       ├── context/         # AuthContext (perfil derivado do JWT), ThemeContext
    │       ├── layouts/         # AppLayout (sidebar + cabeçalho) e VIEW_META
    │       ├── pages/           # AuthPage, PerfilPage
    │       ├── components/      # ecrãs (Dashboard, Cursos, Quizzes, Admin*, Professor*)
    │       │   └── ui/          # primitivos partilhados (TabelaAcessos, MetricCard, …)
    │       ├── hooks/           # useIsMobile, useExportPdf (jspdf carregado sob demanda)
    │       ├── i18n/            # I18nProvider + dicionários PT/EN em strings/*.js
    │       └── test/            # testes Vitest
    └── server/
        ├── index.js             # entrada: exporta a app (supertest/Vercel) e faz listen
        ├── src/
        │   ├── app.js           # montagem do Express (helmet, cors, rate-limit, rotas)
        │   ├── config/          # env, pool PostgreSQL + transações, mailer
        │   ├── middlewares/     # autenticar / exigirPerfil / proprioOuPerfil, erros
        │   ├── routes/          # auth, cursos, quizzes, gamificacao, estatisticas,
        │   │                    # utilizadores, notificacoes, admin
        │   ├── services/        # logs, notificacoes, scoring (correção de quizzes)
        │   └── validacao/       # schemas zod + middleware validar()
        ├── db/
        │   ├── schema.sql       # esquema completo da base de dados
        │   └── migrations/      # migrações incrementais (001…004)
        ├── __tests__/           # testes Jest/Supertest
        ├── vercel.json          # configuração de deploy serverless
        └── .env.example         # modelo das variáveis de ambiente (sem segredos)
```

---

## 🔐 Segurança

- **Autenticação JWT** emitida após validação do código 2FA; enviada em cada pedido no cabeçalho `Authorization: Bearer <token>`. O frontend deriva o **perfil do payload do token** (não do `localStorage`) e expira a sessão proativamente.
- **2FA por email**: código de 6 dígitos gerado com `crypto.randomInt`, válido 10 minutos; **5 tentativas falhadas anulam o código**.
- **Autorização por perfil** em todas as rotas (`autenticar`, `exigirPerfil`, `proprioOuPerfil`); a identidade vem sempre do token, nunca do corpo do pedido. Um professor só edita/apaga os seus próprios cursos e quizzes.
- **Correção de quizzes no servidor**: `GET /quizzes` nunca expõe `resposta_correta`; o aluno submete apenas as opções escolhidas em `POST /quizzes/:grupoId/submeter` e o servidor calcula nota, XP e conquistas numa transação.
- **Validação de entrada com `zod`** em todas as rotas com corpo: política de palavra-passe (mín. 8, 1 maiúscula, 1 especial), emails normalizados, enums, limites de tamanho.
- **Palavras-passe** guardadas com `bcrypt`.
- **`helmet`** (cabeçalhos de segurança), **CORS restrito** a `FRONTEND_ORIGINS`, **rate limiting** global (120/min) e reforçado nas rotas de autenticação (10/15 min).
- **Aprovação de professores**: o registo público só cria `aluno` (ativo) ou `professor` (**inativo até aprovação do admin**); contas `admin` nunca são criadas por registo.
- **Queries parametrizadas** em toda a aplicação; sanitização com DOMPurify de todo o HTML das lições.
- **Auditoria**: a tabela `logs_seguranca` regista logins, falhas de password e de 2FA e é consultável em `/admin/seguranca`.

> ⚠️ Os ficheiros `.env` e dumps `.sql` **não** são versionados (ver `.gitignore`); `db/schema.sql` e `db/migrations/*.sql` são a exceção. Define as variáveis localmente e, em produção, nas *Environment Variables* da Vercel.

---

## ⚙️ Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL (instância local ou na cloud)
- Uma conta de email para o envio dos códigos (Gmail com *App Password*)

### Variáveis de ambiente

Cria `cyberlearn/server/.env` a partir do modelo:

```bash
cp cyberlearn/server/.env.example cyberlearn/server/.env
```

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (ex.: `8080`) |
| `DB_DATABASE` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Ligação ao PostgreSQL |
| `DB_CA_CERT` | (opcional) certificado CA do fornecedor — ativa validação TLS estrita |
| `EMAIL_USER` / `EMAIL_PASS` | Conta de email e *App Password* para envio de códigos |
| `JWT_SECRET` | Segredo para assinar os tokens (**obrigatório** — sem ele o servidor não arranca) |
| `FRONTEND_ORIGINS` | Origens autorizadas no CORS, separadas por vírgula |

Gera um `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

No frontend, `cyberlearn/frontend/.env` define `VITE_API_URL` (ver `.env.example`).

### Base de dados

Para uma base nova:

```bash
psql "$DATABASE_URL" -f cyberlearn/server/db/schema.sql
```

Para uma base existente, aplica as migrações **por ordem** (cada ficheiro inclui a query de verificação):

```bash
psql "$DATABASE_URL" -f cyberlearn/server/db/migrations/001_2fa_tentativas.sql
psql "$DATABASE_URL" -f cyberlearn/server/db/migrations/002_emails_lowercase.sql
psql "$DATABASE_URL" -f cyberlearn/server/db/migrations/003_quiz_ids.sql
psql "$DATABASE_URL" -f cyberlearn/server/db/migrations/004_professores_aprovacao.sql
```

> Faz `pg_dump` antes de cada migração. A 003 tem de ser aplicada **antes** do deploy do código que usa `quiz_grupos`.

---

## ▶️ Como correr (desenvolvimento)

Instala as dependências (raiz, frontend e servidor):

```bash
npm install
npm install --prefix cyberlearn/frontend
npm install --prefix cyberlearn/server
```

Arranca o frontend e o servidor em simultâneo:

```bash
npm run dev
```

Por omissão, o frontend corre em `http://localhost:5173` e a API na porta definida em `PORT`.

---

## ✅ Testes e qualidade

```bash
npm test          # Jest/Supertest (API) + Vitest (UI)
npm run lint      # ESLint no frontend
```

- **API (Jest + Supertest)**: smoke, validação `zod`, escalões de XP e correção de quizzes, autorização por perfil (aluno/professor/admin/sem sessão), tokens inválidos/expirados, cabeçalhos `helmet` e CORS.
- **UI (Vitest + Testing Library)**: cliente HTTP (token, 401 → sessão expirada, `ApiError`), `AuthContext` (perfil derivado do JWT mesmo com `localStorage` adulterado), fluxo completo de quiz (só as opções escolhidas viajam para o servidor; o resultado mostrado é o do servidor).

---

## 🌐 API — principais endpoints

| Método | Rota | Perfis | Descrição |
|--------|------|--------|-----------|
| POST | `/registar` | público | Cria aluno (ativo) ou professor (pendente) |
| POST | `/login` → `/login-2fa` | público | Login em 2 passos com código por email |
| POST | `/recuperar-senha` → `/reset-password` | público | Recuperação de palavra-passe |
| POST | `/atualizar-perfil` | autenticado | Atualização parcial do próprio perfil |
| GET | `/cursos` | autenticado | Cursos aprovados |
| POST/PUT/DELETE | `/cursos[/:id]` | professor (próprios), admin | Gestão de cursos |
| GET | `/quizzes` | autenticado | Avaliações aprovadas (sem respostas certas) |
| POST | `/quizzes/:grupoId/submeter` | autenticado | Submete respostas; servidor corrige, credita XP e conquistas |
| POST/DELETE | `/quizzes[/:grupoId]` | professor (próprios), admin | Gestão de avaliações |
| GET | `/conquistas/:id`, `/classificacao`, `/estatisticas/aluno/:id[/atividades]` | próprio, professor, admin | Gamificação e estatísticas |
| GET | `/alunos`, `/professor/alunos`, `/professor/aluno/:id/detalhes` | professor, admin | Acompanhamento de alunos |
| GET | `/notificacoes/:id` | próprio, admin | Centro de notificações |
| GET | `/admin/pendentes` | admin | Professores, cursos e quizzes por aprovar |
| PUT/DELETE | `/admin/aprovar|rejeitar/{professor,curso,quiz}/:id` | admin | Decisões de aprovação |
| GET | `/admin/logs-seguranca?tipo=&limite=&pagina=` | admin | Auditoria de segurança |
| GET | `/professores`, `/acessos`, `/acessos-professores`, `/admin-estatisticas` | admin (acessos: também professor) | Gestão e métricas |
| DELETE | `/utilizadores/:id`, `/professores/:id` | admin | Remoção de contas |

Erros seguem sempre o formato `{ "erro": "mensagem" }`; validações devolvem `400`, falta de sessão `401`, falta de permissão `403`.

---

## 🚀 Deploy (Vercel)

O backend corre como função serverless (`cyberlearn/server/vercel.json`); o frontend tem *rewrite* SPA (`cyberlearn/frontend/vercel.json`).

1. Liga o repositório à Vercel (dois projetos: `cyberlearn/server` e `cyberlearn/frontend`).
2. Em **Settings → Environment Variables**, define todas as variáveis listadas acima para **Production**.
3. Aplica as migrações na base de dados de produção.
4. Faz *Redeploy* para aplicar as variáveis.

---

## 📜 Scripts (raiz)

| Comando | Ação |
|---------|------|
| `npm run dev` | Arranca frontend + servidor (via `concurrently`) |
| `npm run server` | Arranca apenas a API |
| `npm run frontend` | Arranca apenas o frontend |
| `npm test` | Corre os testes da API e da UI |
| `npm run lint` | Lint do frontend |

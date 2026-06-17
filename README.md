# 🛡️ CyberLearn

Plataforma de e-learning de cibersegurança com cursos, lições, quizzes e gamificação.
Suporta três perfis de utilizador — **Aluno**, **Professor** e **Administrador** — cada um com o seu painel e permissões.

---

## ✨ Funcionalidades

### Aluno
- Catálogo de cursos e lições aprovadas
- Quizzes de avaliação com pontuação e XP
- Gamificação: XP, troféus/conquistas, *streaks* de login e classificação (ranking)
- Dashboard com estatísticas reais (taxa de acerto, dias seguidos, conquistas)
- Centro de notificações

### Professor
- Criação, edição e remoção dos seus próprios cursos e quizzes
- Conteúdos enviados ficam a aguardar aprovação do administrador
- Acompanhamento do progresso e notas dos alunos

### Administrador
- Aprovação/rejeição de cursos e quizzes pendentes
- Gestão de professores e utilizadores
- Estatísticas globais da plataforma e registos de acesso

---

## 🧱 Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, Vite |
| Backend | Node.js, Express 5 |
| Base de dados | PostgreSQL (`pg`) |
| Autenticação | JWT, 2FA por email (Nodemailer), `bcrypt` |
| Segurança | `express-rate-limit`, autorização por perfil |
| Deploy | Vercel |

---

## 📁 Estrutura

```
cyberlearn/
├── package.json            # scripts de orquestração (raiz)
└── cyberlearn/
    ├── frontend/           # aplicação React + Vite
    │   └── src/
    │       ├── api.js       # cliente HTTP (anexa o token JWT)
    │       ├── App.jsx      # estado global e routing por vista
    │       └── components/  # ecrãs (Auth, Dashboard, Cursos, Quizzes, ...)
    └── server/
        ├── index.js        # API Express (todas as rotas)
        ├── vercel.json     # configuração de deploy serverless
        └── .env.example    # modelo das variáveis de ambiente
```

---

## 🔐 Segurança

- **Autenticação JWT**: o token é emitido após validação do código 2FA e enviado em cada pedido no cabeçalho `Authorization: Bearer <token>`.
- **2FA por email**: código de 6 dígitos válido por 10 minutos no login.
- **Autorização por perfil**: cada rota é protegida por middlewares (`autenticar`, `exigirPerfil`, `proprioOuPerfil`); a identidade é sempre derivada do token, nunca do corpo do pedido.
- **Palavras-passe** guardadas com `bcrypt`.
- **Rate limiting** nas rotas de autenticação (login, 2FA, registo, recuperação).
- O registo público só permite os perfis `aluno` e `professor` (contas `admin` nunca são criadas por registo).
- Queries parametrizadas em toda a aplicação (proteção contra SQL injection).

> ⚠️ Os ficheiros `.env` e dumps `.sql` **não** são versionados (ver `.gitignore`). Define as variáveis localmente e, em produção, nas *Environment Variables* da Vercel.

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
| `DB_DATABASE` | Nome da base de dados |
| `DB_USER` | Utilizador do PostgreSQL |
| `DB_PASSWORD` | Palavra-passe do PostgreSQL |
| `DB_HOST` | Host da base de dados |
| `DB_PORT` | Porta do PostgreSQL (ex.: `5432`) |
| `EMAIL_USER` | Conta de email para envio de códigos |
| `EMAIL_PASS` | *App Password* do email |
| `JWT_SECRET` | Segredo para assinar os tokens (**obrigatório** — sem ele o servidor não arranca) |

Gera um `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

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

Ou cada um separadamente:

```bash
npm run server     # API Express
npm run frontend   # aplicação Vite
```

Por omissão, o frontend corre em `http://localhost:5173` e a API na porta definida em `PORT`.
O endereço da API usado pelo frontend está em `cyberlearn/frontend/src/api.js` (`API_URL`).

---

## 🚀 Deploy (Vercel)

O backend está preparado para correr como função serverless (`cyberlearn/server/vercel.json`).

1. Liga o repositório à Vercel.
2. Em **Settings → Environment Variables**, define todas as variáveis listadas acima
   (incluindo `JWT_SECRET`) para o ambiente **Production**.
3. Faz um *Redeploy* para aplicar as variáveis.
4. Verifica o estado em `GET /teste-bd`.

---

## 📜 Scripts (raiz)

| Comando | Ação |
|---------|------|
| `npm run dev` | Arranca frontend + servidor (via `concurrently`) |
| `npm run server` | Arranca apenas a API |
| `npm run frontend` | Arranca apenas o frontend |

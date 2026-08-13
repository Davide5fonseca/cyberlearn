const { z } = require('zod');

// ---------- Blocos reutilizáveis ----------

// Mesma política que o frontend impõe no atributo `pattern` — mas aqui é obrigatória.
const password = z.string({ error: 'A palavra-passe é obrigatória.' })
    .min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'A palavra-passe deve incluir pelo menos uma letra maiúscula.')
    .regex(/[^a-zA-Z0-9]/, 'A palavra-passe deve incluir pelo menos um caracter especial.');

// Emails são sempre normalizados: 'Ana@X.pt' e 'ana@x.pt' são a mesma conta.
const email = z.string({ error: 'O email é obrigatório.' })
    .trim().toLowerCase()
    .pipe(z.email('O email não é válido.'));

const textoObrigatorio = (campo, max = 255) =>
    z.string({ error: `${campo} é obrigatório.` }).trim()
        .min(1, `${campo} é obrigatório.`).max(max, `${campo} é demasiado longo.`);

const codigo6Digitos = z.string({ error: 'O código é obrigatório.' })
    .trim().regex(/^\d{6}$/, 'O código deve ter 6 dígitos.');

const inteiroPositivo = (campo) => z.coerce.number({ error: `${campo} inválido.` })
    .int(`${campo} inválido.`).positive(`${campo} inválido.`);

// Avatares viajam como data-URL base64: ~700k caracteres ≈ imagem de 500KB.
const avatar = z.string().max(700000, 'A imagem de avatar é demasiado grande (máx. ~500KB).');

// ---------- Autenticação ----------

const registarSchema = z.object({
    nome: textoObrigatorio('O nome'),
    email,
    password,
    tipo: z.string({ error: 'Tipo de conta inválido.' }).trim().toLowerCase()
        .pipe(z.enum(['aluno', 'professor'], { error: 'Tipo de conta inválido.' }))
});

const loginSchema = z.object({
    email,
    password: z.string({ error: 'A palavra-passe é obrigatória.' }).min(1, 'A palavra-passe é obrigatória.')
});

const login2FASchema = z.object({
    utilizadorId: inteiroPositivo('Utilizador'),
    token: codigo6Digitos
});

const recuperarSenhaSchema = z.object({ email });

const resetPasswordSchema = z.object({
    email,
    token: codigo6Digitos,
    novaPassword: password
});

const atualizarPerfilSchema = z.object({
    nome: textoObrigatorio('O nome').optional(),
    senhaAtual: z.string().optional(),
    novaSenha: password.optional(),
    avatar: avatar.nullish(),
    biografiaProf: z.string().max(5000).nullish(),
    metodologia: z.string().max(5000).nullish(),
    nivelExperiencia: z.string().max(100).nullish(),
    interesse: z.string().max(255).nullish(),
    biografia: z.string().max(5000).nullish(),
    github: z.string().max(255).nullish(),
    linkedin: z.string().max(255).nullish()
});

// ---------- Cursos e quizzes ----------

const cursoSchema = z.object({
    titulo: textoObrigatorio('O título'),
    nivel: z.string().max(100).nullish(),
    descricao: z.string().max(5000).nullish(),
    conteudo_licao: z.string().max(200000, 'O conteúdo da lição é demasiado longo.').nullish()
});

const quizSchema = z.object({
    titulo: textoObrigatorio('O título'),
    curso_id: inteiroPositivo('Curso'),
    pergunta: textoObrigatorio('A pergunta', 2000),
    opcao_a: textoObrigatorio('A opção A', 1000),
    opcao_b: textoObrigatorio('A opção B', 1000),
    opcao_c: textoObrigatorio('A opção C', 1000),
    opcao_d: textoObrigatorio('A opção D', 1000),
    resposta_correta: z.string({ error: 'A resposta correta é obrigatória.' }).trim().toLowerCase()
        .pipe(z.enum(['a', 'b', 'c', 'd'], { error: 'A resposta correta deve ser a, b, c ou d.' }))
});

const salvarResultadoSchema = z.object({
    quizTitulo: textoObrigatorio('O título do quiz'),
    acertos: z.coerce.number().int().min(0),
    totalPerguntas: z.coerce.number().int().min(0)
});

// ---------- Gamificação ----------

const atribuirConquistaSchema = z.object({
    nomeConquista: textoObrigatorio('O nome da conquista')
});

const adicionarXpSchema = z.object({
    quantidade: z.coerce.number({ error: 'Quantidade inválida.' }).int().min(0)
});

// ---------- Admin ----------

const tituloQuizSchema = z.object({
    titulo: textoObrigatorio('O título')
});

// Middleware: valida req.body contra o schema; 400 com a primeira mensagem de erro.
const validar = (schema) => (req, res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
        const mensagem = resultado.error.issues[0]?.message || 'Dados inválidos.';
        return res.status(400).json({ erro: mensagem });
    }
    req.body = resultado.data;
    next();
};

module.exports = {
    validar,
    registarSchema,
    loginSchema,
    login2FASchema,
    recuperarSenhaSchema,
    resetPasswordSchema,
    atualizarPerfilSchema,
    cursoSchema,
    quizSchema,
    salvarResultadoSchema,
    atribuirConquistaSchema,
    adicionarXpSchema,
    tituloQuizSchema
};

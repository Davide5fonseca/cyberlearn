process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-so-para-testes';

const request = require('supertest');
const app = require('../index');
const { registarSchema, atualizarPerfilSchema, quizSchema } = require('../src/validacao/schemas');

describe('schemas de validação', () => {
    test('registo recusa tipo admin', () => {
        const r = registarSchema.safeParse({ nome: 'Ana', email: 'ana@x.pt', password: 'Segura#123', tipo: 'admin' });
        expect(r.success).toBe(false);
    });

    test('registo normaliza o email para minúsculas', () => {
        const r = registarSchema.safeParse({ nome: 'Ana', email: '  ANA@Exemplo.PT ', password: 'Segura#123', tipo: 'aluno' });
        expect(r.success).toBe(true);
        expect(r.data.email).toBe('ana@exemplo.pt');
    });

    test.each(['curta#A', 'semmaiuscula#1', 'SemEspecial123', 'a'])('registo recusa password fraca: "%s"', (password) => {
        const r = registarSchema.safeParse({ nome: 'Ana', email: 'ana@x.pt', password, tipo: 'aluno' });
        expect(r.success).toBe(false);
    });

    test('atualizar-perfil aceita corpo parcial sem exigir os restantes campos', () => {
        const r = atualizarPerfilSchema.safeParse({ nome: 'Novo Nome' });
        expect(r.success).toBe(true);
        expect(r.data.biografia).toBeUndefined();
    });

    test('quiz recusa resposta_correta fora de a-d', () => {
        const r = quizSchema.safeParse({
            titulo: 'T', curso_id: 1, pergunta: 'P?',
            opcao_a: 'A', opcao_b: 'B', opcao_c: 'C', opcao_d: 'D',
            resposta_correta: 'x'
        });
        expect(r.success).toBe(false);
    });
});

describe('validação nas rotas (sem tocar na BD)', () => {
    test('POST /registar com tipo admin devolve 400', async () => {
        const res = await request(app).post('/registar')
            .send({ nome: 'Eu', email: 'eu@x.pt', password: 'Segura#123', tipo: 'admin' });
        expect(res.status).toBe(400);
        expect(res.body.erro).toBeDefined();
    });

    test('POST /registar com password de 1 caracter devolve 400', async () => {
        const res = await request(app).post('/registar')
            .send({ nome: 'Eu', email: 'eu@x.pt', password: 'a', tipo: 'aluno' });
        expect(res.status).toBe(400);
    });

    test('POST /login sem email válido devolve 400', async () => {
        const res = await request(app).post('/login')
            .send({ email: 'nao-e-um-email', password: 'x' });
        expect(res.status).toBe(400);
    });
});

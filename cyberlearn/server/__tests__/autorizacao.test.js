process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-so-para-testes';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index');

const tokenDe = (perfil, id = 1) =>
    jwt.sign({ id, perfil, nome: 'Teste', email: 't@x.pt' }, process.env.JWT_SECRET);

// Estes testes verificam a camada de autorização (middlewares) — falham ANTES
// de qualquer acesso à base de dados, pelo que não precisam de PostgreSQL.
describe('regras de perfil por rota', () => {
    describe('aluno', () => {
        const auth = { Authorization: `Bearer ${tokenDe('aluno', 10)}` };

        test.each([
            ['GET', '/admin/pendentes'],
            ['GET', '/professores'],
            ['GET', '/acessos-professores'],
            ['GET', '/admin-estatisticas'],
            ['GET', '/alunos'],
            ['GET', '/professor/alunos'],
            ['GET', '/professor/aluno/5/detalhes'],
            ['DELETE', '/utilizadores/5'],
            ['DELETE', '/professores/5'],
            ['PUT', '/admin/aprovar/curso/1'],
            ['DELETE', '/admin/rejeitar/curso/1'],
        ])('%s %s devolve 403', async (metodo, rota) => {
            const res = await request(app)[metodo.toLowerCase()](rota).set(auth);
            expect(res.status).toBe(403);
        });

        test('não pode criar cursos (403)', async () => {
            const res = await request(app).post('/cursos').set(auth)
                .send({ titulo: 'X', nivel: 'iniciante', descricao: 'd', conteudo_licao: '[]' });
            expect(res.status).toBe(403);
        });

        test('não pode ver conquistas de outro aluno (403)', async () => {
            const res = await request(app).get('/conquistas/99').set(auth);
            expect(res.status).toBe(403);
        });

        test('não pode ver notificações de outro utilizador (403)', async () => {
            const res = await request(app).get('/notificacoes/99').set(auth);
            expect(res.status).toBe(403);
        });
    });

    describe('professor', () => {
        const auth = { Authorization: `Bearer ${tokenDe('professor', 20)}` };

        test.each([
            ['GET', '/admin/pendentes'],
            ['GET', '/professores'],
            ['GET', '/acessos-professores'],
            ['GET', '/admin-estatisticas'],
            ['GET', '/admin/logs-seguranca'],
            ['DELETE', '/utilizadores/5'],
            ['DELETE', '/professores/5'],
            ['PUT', '/admin/aprovar/curso/1'],
            ['PUT', '/admin/aprovar/quiz/1'],
            ['PUT', '/admin/aprovar/professor/1'],
        ])('%s %s devolve 403', async (metodo, rota) => {
            const res = await request(app)[metodo.toLowerCase()](rota).set(auth);
            expect(res.status).toBe(403);
        });

        test('não pode listar cursos de outro professor (403)', async () => {
            const res = await request(app).get('/professor/cursos/21').set(auth);
            expect(res.status).toBe(403);
        });
    });

    describe('sem sessão', () => {
        test.each([
            '/cursos', '/quizzes', '/classificacao', '/alunos', '/admin/pendentes',
            '/estatisticas/aluno/1', '/notificacoes/1', '/admin/logs-seguranca'
        ])('GET %s devolve 401', async (rota) => {
            const res = await request(app).get(rota);
            expect(res.status).toBe(401);
        });

        test('token inválido devolve 401', async () => {
            const res = await request(app).get('/cursos').set('Authorization', 'Bearer nao-e-um-jwt');
            expect(res.status).toBe(401);
        });

        test('token assinado com outro segredo devolve 401', async () => {
            const falso = jwt.sign({ id: 1, perfil: 'admin' }, 'outro-segredo');
            const res = await request(app).get('/admin/pendentes').set('Authorization', `Bearer ${falso}`);
            expect(res.status).toBe(401);
        });

        test('token expirado devolve 401', async () => {
            const expirado = jwt.sign({ id: 1, perfil: 'admin' }, process.env.JWT_SECRET, { expiresIn: -10 });
            const res = await request(app).get('/admin/pendentes').set('Authorization', `Bearer ${expirado}`);
            expect(res.status).toBe(401);
        });
    });

    describe('cabeçalhos de segurança', () => {
        test('helmet aplica X-Content-Type-Options e X-Frame-Options', async () => {
            const res = await request(app).get('/cursos');
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-frame-options']).toBeDefined();
        });

        test('CORS não devolve wildcard para origem desconhecida', async () => {
            const res = await request(app).get('/cursos').set('Origin', 'https://site-malicioso.example');
            expect(res.headers['access-control-allow-origin']).not.toBe('*');
            expect(res.headers['access-control-allow-origin']).not.toBe('https://site-malicioso.example');
        });
    });
});

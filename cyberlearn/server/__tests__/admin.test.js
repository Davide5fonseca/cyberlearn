process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-so-para-testes';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index');

const tokenDe = (perfil, id = 1) =>
    jwt.sign({ id, perfil, nome: 'Teste', email: 't@x.pt' }, process.env.JWT_SECRET);

describe('autorização das rotas de administração', () => {
    test('GET /admin/logs-seguranca sem token devolve 401', async () => {
        const res = await request(app).get('/admin/logs-seguranca');
        expect(res.status).toBe(401);
    });

    test('GET /admin/logs-seguranca como aluno devolve 403', async () => {
        const res = await request(app).get('/admin/logs-seguranca')
            .set('Authorization', `Bearer ${tokenDe('aluno')}`);
        expect(res.status).toBe(403);
    });

    test('PUT /admin/aprovar/professor/:id como professor devolve 403', async () => {
        const res = await request(app).put('/admin/aprovar/professor/2')
            .set('Authorization', `Bearer ${tokenDe('professor')}`);
        expect(res.status).toBe(403);
    });

    test('DELETE /admin/rejeitar/professor/:id como aluno devolve 403', async () => {
        const res = await request(app).delete('/admin/rejeitar/professor/2')
            .set('Authorization', `Bearer ${tokenDe('aluno')}`);
        expect(res.status).toBe(403);
    });
});

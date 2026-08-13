process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-so-para-testes';

const request = require('supertest');
const app = require('../index');

describe('smoke', () => {
    test('a app é exportada como função (sem arrancar o listener)', () => {
        expect(typeof app).toBe('function');
    });

    test('GET /cursos sem token devolve 401', async () => {
        const res = await request(app).get('/cursos');
        expect(res.status).toBe(401);
        expect(res.body.erro).toBeDefined();
    });

    test('GET /admin/pendentes sem token devolve 401', async () => {
        const res = await request(app).get('/admin/pendentes');
        expect(res.status).toBe(401);
    });
});

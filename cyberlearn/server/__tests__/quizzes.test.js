process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-so-para-testes';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index');
const { xpPorPercentagem, conquistasPorPercentagem } = require('../src/services/scoring');

const tokenDe = (perfil, id = 1) =>
    jwt.sign({ id, perfil, nome: 'Teste', email: 't@x.pt' }, process.env.JWT_SECRET);

describe('escalões de XP e conquistas (lógica agora no servidor)', () => {
    test.each([
        [100, 100], [90, 75], [80, 75], [79, 50], [50, 50], [49, 10], [0, 10]
    ])('%i%% de acerto dá %i XP', (pct, xp) => {
        expect(xpPorPercentagem(pct)).toBe(xp);
    });

    test('conquistas por percentagem', () => {
        expect(conquistasPorPercentagem(0)).toEqual(['Primeiro Sangue']);
        expect(conquistasPorPercentagem(50)).toEqual(['Primeiro Sangue', 'Escudo Ativo']);
        expect(conquistasPorPercentagem(100)).toEqual(['Primeiro Sangue', 'Escudo Ativo', 'Hacker Perfeito']);
    });
});

describe('rotas de quizzes', () => {
    test('POST /quizzes/:id/submeter sem token devolve 401', async () => {
        const res = await request(app).post('/quizzes/1/submeter').send({ respostas: [{ perguntaId: 1, opcao: 'A' }] });
        expect(res.status).toBe(401);
    });

    test('submissão com corpo inválido devolve 400 (validação antes da BD)', async () => {
        const res = await request(app).post('/quizzes/1/submeter')
            .set('Authorization', `Bearer ${tokenDe('aluno')}`)
            .send({ respostas: [{ perguntaId: 1, opcao: 'Z' }] });
        expect(res.status).toBe(400);
    });

    test('aluno não pode criar quizzes (403)', async () => {
        const res = await request(app).post('/quizzes')
            .set('Authorization', `Bearer ${tokenDe('aluno')}`)
            .send({ titulo: 'X', curso_id: 1, pergunta: 'P?', opcao_a: 'a', opcao_b: 'b', opcao_c: 'c', opcao_d: 'd', resposta_correta: 'A' });
        expect(res.status).toBe(403);
    });

    test('DELETE /quizzes/:id com id não numérico devolve 400', async () => {
        const res = await request(app).delete('/quizzes/abc')
            .set('Authorization', `Bearer ${tokenDe('professor')}`);
        expect(res.status).toBe(400);
    });

    test('as rotas de gamificação auto-atribuível foram removidas (404)', async () => {
        const auth = { Authorization: `Bearer ${tokenDe('aluno')}` };
        const xp = await request(app).post('/xp/adicionar').set(auth).send({ quantidade: 100 });
        const conquista = await request(app).post('/conquistas/atribuir').set(auth).send({ nomeConquista: 'Hacker Perfeito' });
        const resultado = await request(app).post('/quizzes/salvar-resultado').set(auth).send({ quizTitulo: 'X', acertos: 50, totalPerguntas: 50 });
        expect(xp.status).toBe(404);
        expect(conquista.status).toBe(404);
        // /quizzes/salvar-resultado agora cai em /quizzes/:grupoId ... rota inexistente → 404
        expect([400, 404]).toContain(resultado.status);
    });
});

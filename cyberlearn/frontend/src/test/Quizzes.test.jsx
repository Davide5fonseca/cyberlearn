import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Quizzes from '../components/Quizzes';
import { I18nProvider } from '../i18n';
import { UIProvider } from '../components/ui/UIProvider';

const theme = {
  cardBg: '#fff', shadow: 'none', inputBorder: '#ccc', inputBg: '#eee',
  textMain: '#000', textSub: '#666', primary: '#3b82f6', gradient: 'none',
  danger: '#ef4444', success: '#10b981', warning: '#f59e0b'
};

// Um quiz tal como GET /quizzes o devolve: SEM resposta_correta.
const quizzesDoServidor = [{
  grupoId: 42, titulo: 'Phishing 101', nome_curso: 'Intro', nivel_curso: 'iniciante',
  perguntas: [
    { id: 1, pergunta: 'O que é phishing?', opcoes: [{ letra: 'A', texto: 'Pesca' }, { letra: 'B', texto: 'Fraude por email' }] },
    { id: 2, pergunta: 'Devo clicar em links suspeitos?', opcoes: [{ letra: 'A', texto: 'Sim' }, { letra: 'B', texto: 'Não' }] },
  ]
}];

const respostaJson = (status, body) => ({ ok: status < 300, status, json: async () => body });

const renderQuizzes = () => render(
  <I18nProvider><UIProvider>
    <Quizzes theme={theme} setView={() => {}} targetQuizCourse={null} setTargetQuizCourse={() => {}} />
  </UIProvider></I18nProvider>
);

describe('Quizzes (correção no servidor)', () => {
  test('envia apenas as opções escolhidas e mostra o resultado devolvido pelo servidor', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).endsWith('/quizzes')) return respostaJson(200, quizzesDoServidor);
      if (String(url).endsWith('/quizzes/42/submeter')) {
        return respostaJson(200, { acertos: 2, total: 2, percentagem: 100, xpGanho: 100, xpTotal: 100, conquistasNovas: [{ nome: 'Hacker Perfeito', icone: '🏆' }], corrigidas: [] });
      }
      return respostaJson(404, {});
    });

    const user = userEvent.setup();
    renderQuizzes();

    // Lista carregada
    await screen.findByText('Phishing 101');
    // Não há qualquer resposta certa no payload recebido pelo cliente
    expect(JSON.stringify(quizzesDoServidor)).not.toContain('resposta_correta');

    // Iniciar quiz
    await user.click(screen.getByRole('button', { name: /iniciar quiz|start quiz/i }));
    await screen.findByText('O que é phishing?');

    // Pergunta 1: opção B, avançar
    await user.click(screen.getByText('Fraude por email'));
    await user.click(screen.getByRole('button', { name: /confirmar|confirm/i }));

    // Pergunta 2: opção B, finalizar
    await screen.findByText('Devo clicar em links suspeitos?');
    await user.click(screen.getByText('Não'));
    await user.click(screen.getByRole('button', { name: /finalizar|finish/i }));

    // O pedido de submissão contém só as opções escolhidas
    await waitFor(() => {
      const chamada = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/quizzes/42/submeter'));
      expect(chamada).toBeTruthy();
      const body = JSON.parse(chamada[1].body);
      expect(body).toEqual({ respostas: [{ perguntaId: 1, opcao: 'B' }, { perguntaId: 2, opcao: 'B' }] });
      // Nunca enviamos pontuação/XP calculados no cliente
      expect(body).not.toHaveProperty('acertos');
      expect(body).not.toHaveProperty('xp');
    });

    // Ecrã de resultado alimentado pelo servidor
    expect(await screen.findByText(/100 XP/)).toBeInTheDocument();
    expect(screen.getByText(/Hacker Perfeito/)).toBeInTheDocument();
  });
});

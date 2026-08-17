import { describe, test, expect, vi, beforeEach } from 'vitest';
import { apiFetch, apiJson, ApiError, setOnSessionExpired } from '../api';

const respostaJson = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('api.js', () => {
  beforeEach(() => {
    localStorage.clear();
    setOnSessionExpired(null);
  });

  test('anexa o token JWT no header Authorization', async () => {
    localStorage.setItem('cyberlearn_token', 'abc.def.ghi');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaJson(200, []));

    await apiFetch('/cursos');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('um 401 dispara o callback de sessão expirada em vez de recarregar a página', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaJson(401, { erro: 'Sessão inválida' }));
    const onExpired = vi.fn();
    setOnSessionExpired(onExpired);

    await apiFetch('/cursos');

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  test('um 401 no próprio /login não conta como sessão expirada', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaJson(401, { erro: 'Credenciais erradas' }));
    const onExpired = vi.fn();
    setOnSessionExpired(onExpired);

    await apiFetch('/login', { method: 'POST' });

    expect(onExpired).not.toHaveBeenCalled();
  });

  test('apiJson lança ApiError com a mensagem do servidor em respostas de erro', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaJson(400, { erro: 'Dados inválidos.' }));

    await expect(apiJson('/registar', { method: 'POST' })).rejects.toMatchObject({
      name: 'Error',
      message: 'Dados inválidos.',
      status: 400,
    });
    await expect(apiJson('/registar')).rejects.toBeInstanceOf(ApiError);
  });

  test('apiJson devolve o corpo em caso de sucesso', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaJson(200, { ok: true }));
    await expect(apiJson('/x')).resolves.toEqual({ ok: true });
  });
});

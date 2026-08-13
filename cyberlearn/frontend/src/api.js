// Endereço da API. Definido por VITE_API_URL em build/dev; o fallback
// garante que produção continua a funcionar mesmo sem a variável definida.
export const API_URL = import.meta.env.VITE_API_URL || 'https://cyberlearn-nine.vercel.app';

// Lê o token JWT guardado após o login.
export function getToken() {
  try { return localStorage.getItem('cyberlearn_token'); } catch { return null; }
}

// Registado pelo AuthContext: chamado quando o servidor devolve 401.
// Substitui o antigo window.location.reload(), que perdia trabalho não guardado.
let onSessionExpired = null;
export function setOnSessionExpired(fn) { onSessionExpired = fn; }

export class ApiError extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;

  // Anexa automaticamente o token de autenticação, se existir.
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  // Sessão inválida/expirada: o AuthContext limpa o estado e navega para o login.
  if (response.status === 401 && !path.startsWith('/login') && !path.startsWith('/registar')) {
    if (onSessionExpired) onSessionExpired();
  }

  return response;
}

// Variante que valida a resposta: devolve o JSON em caso de sucesso e
// lança ApiError com a mensagem do servidor em caso de falha.
export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  let data = null;
  try { data = await response.json(); } catch { /* resposta sem corpo */ }
  if (!response.ok) {
    throw new ApiError(data?.erro || 'Ocorreu um erro no servidor.', response.status);
  }
  return data;
}

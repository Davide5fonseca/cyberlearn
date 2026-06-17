export const API_URL = 'https://cyberlearn-nine.vercel.app';

// Lê o token JWT guardado após o login.
export function getToken() {
  try { return localStorage.getItem('cyberlearn_token'); } catch { return null; }
}

export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;

  // Anexa automaticamente o token de autenticação, se existir.
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  // Sessão inválida/expirada: limpa o estado local e volta ao login.
  if (response.status === 401) {
    try {
      localStorage.removeItem('cyberlearn_token');
      localStorage.removeItem('cyberlearn_user');
    } catch {}
    if (!path.startsWith('/login') && !path.startsWith('/registar')) {
      window.location.reload();
    }
  }

  return response;
}

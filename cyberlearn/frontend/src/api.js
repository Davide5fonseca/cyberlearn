export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, options);
  return response;
}

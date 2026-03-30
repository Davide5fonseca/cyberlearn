// Substitui o link abaixo pelo link VERDADEIRO do teu backend no Render
export const API_URL = import.meta.env.VITE_API_URL || 'https://cyberlearn-4ght.onrender.com';

export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, options);
  return response;
}
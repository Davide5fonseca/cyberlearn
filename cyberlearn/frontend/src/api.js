export const API_URL = "https://cyberlearn-nine.vercel.app";

export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, options);
  return response;
}

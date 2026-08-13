/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setOnSessionExpired } from '../api';

// Descodifica o payload de um JWT sem o validar (a validação é do servidor).
// Serve apenas para ler perfil/expiração no cliente.
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

const tokenValido = (token) => {
  const payload = decodeJwt(token);
  return payload && (!payload.exp || payload.exp * 1000 > Date.now());
};

const lerStorage = (chave) => {
  try { return localStorage.getItem(chave); } catch { return null; }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = lerStorage('cyberlearn_token');
    return t && tokenValido(t) ? t : null;
  });

  // Objeto de perfil rico (avatar, biografia, …) vindo do login.
  // ⚠️ O PAPEL nunca é lido daqui: vem sempre do payload do JWT.
  const [user, setUser] = useState(() => {
    try {
      const saved = lerStorage('cyberlearn_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // O perfil autoritativo vem do token — editar o localStorage não muda permissões
  // (e o servidor valida sempre; isto afeta apenas a navegação da UI).
  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const perfil = payload?.perfil || null;
  const autenticado = Boolean(token && perfil);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('cyberlearn_user', JSON.stringify(user));
      else localStorage.removeItem('cyberlearn_user');
    } catch { /* storage indisponível */ }
  }, [user]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('cyberlearn_token');
      localStorage.removeItem('cyberlearn_user');
    } catch { /* storage indisponível */ }
  }, []);

  // Chamado pelo AuthPage após o 2FA validar com sucesso.
  const login = useCallback((novoToken, dadosUtilizador) => {
    try { localStorage.setItem('cyberlearn_token', novoToken); } catch { /* storage indisponível */ }
    setToken(novoToken);
    setUser(dadosUtilizador);
  }, []);

  const atualizarUser = useCallback((parcial) => {
    setUser((prev) => ({ ...prev, ...parcial }));
  }, []);

  // 401 do servidor em qualquer pedido → sessão terminada.
  useEffect(() => {
    setOnSessionExpired(() => logout());
    return () => setOnSessionExpired(null);
  }, [logout]);

  // Expira a sessão proativamente quando o token caduca (em vez de esperar por um 401).
  useEffect(() => {
    if (!token) return;
    const p = decodeJwt(token);
    if (!p?.exp) return;
    const restante = p.exp * 1000 - Date.now();
    if (restante <= 0) { logout(); return; }
    const timer = setTimeout(logout, restante);
    return () => clearTimeout(timer);
  }, [token, logout]);

  const value = useMemo(
    () => ({ token, user, perfil, autenticado, login, logout, atualizarUser }),
    [token, user, perfil, autenticado, login, logout, atualizarUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth só pode ser usado dentro de <AuthProvider>.');
  return ctx;
}

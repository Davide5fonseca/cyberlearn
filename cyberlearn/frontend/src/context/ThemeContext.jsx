/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Tema centralizado: substitui o prop-drilling do objeto `theme` do antigo App.jsx.
// (A migração completa para tokens CSS acontece na fase de UI.)
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberlearn_darkMode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch { return true; }
  });

  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#070b14' : '#f8fafc';
    document.body.style.transition = 'background-color 0.3s ease';
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
    try { localStorage.setItem('cyberlearn_darkMode', JSON.stringify(isDarkMode)); } catch { /* storage indisponível */ }
  }, [isDarkMode]);

  const theme = useMemo(() => ({
    bg:          isDarkMode ? '#070b14' : '#f8fafc',
    cardBg:      isDarkMode ? '#0f172a' : '#ffffff',
    sidebarBg:   isDarkMode ? '#0b1120' : '#ffffff',
    textMain:    isDarkMode ? '#e2e8f0' : '#0f172a',
    textSub:     isDarkMode ? '#94a3b8' : '#64748b',
    inputBg:     isDarkMode ? '#16213a' : '#f8fafc',
    inputBorder: isDarkMode ? '#243044' : '#e2e8f0',
    inputText:   isDarkMode ? '#e2e8f0' : '#0f172a',
    shadow:      isDarkMode ? '0 10px 30px -12px rgba(0,0,0,0.65)' : '0 4px 16px -4px rgba(15,23,42,0.10)',
    iconBg:      isDarkMode ? '#16213a' : '#f1f5f9',
    iconColor:   isDarkMode ? '#facc15' : '#475569',
    primary:     '#3b82f6',
    accent:      '#22d3ee',
    gradient:    'linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%)',
    danger:      '#ef4444',
    warning:     '#f59e0b',
    success:     '#10b981',
    textUniversal: '#2563eb',
  }), [isDarkMode]);

  const value = useMemo(() => ({ theme, isDarkMode, setIsDarkMode }), [theme, isDarkMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme só pode ser usado dentro de <ThemeProvider>.');
  return ctx;
}

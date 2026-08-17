/* eslint-disable react-refresh/only-export-components */
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Dicionários modulares: cada ficheiro em ./strings/ exporta { pt, en } e é
// fundido automaticamente — módulos novos não tocam em ficheiros existentes.
const modulos = import.meta.glob('./strings/*.js', { eager: true });

export const messages = { pt: {}, en: {} };
for (const mod of Object.values(modulos)) {
  Object.assign(messages.pt, mod.pt || {});
  Object.assign(messages.en, mod.en || {});
}

export const IDIOMAS = [
  { codigo: 'pt', label: 'PT' },
  { codigo: 'en', label: 'EN' },
];

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const guardado = localStorage.getItem('cyberlearn_lang');
      return guardado === 'en' ? 'en' : 'pt';
    } catch { return 'pt'; }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('cyberlearn_lang', lang); } catch { /* storage indisponível */ }
  }, [lang]);

  // Fallback em cadeia: idioma ativo → português → a própria chave.
  const t = useCallback(
    (key) => messages[lang][key] ?? messages.pt[key] ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n só pode ser usado dentro de <I18nProvider>.');
  return ctx;
}

// Compatibilidade com os componentes existentes: `const t = useTranslation()`.
export function useTranslation() {
  return useI18n().t;
}

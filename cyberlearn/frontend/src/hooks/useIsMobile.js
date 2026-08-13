import { useSyncExternalStore } from 'react';

// Breakpoint único da aplicação (as media queries CSS chegam na fase de UI).
const query = '(max-width: 850px)';

const subscribe = (callback) => {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
};

const getSnapshot = () => window.matchMedia(query).matches;

// Substitui o antigo listener de resize sem throttle que re-renderizava a app toda.
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

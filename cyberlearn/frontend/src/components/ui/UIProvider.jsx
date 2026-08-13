/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Contexto de UI global: notificações (toasts) não-bloqueantes e um diálogo
// de confirmação que devolve uma Promise<boolean>. Substitui alert()/confirm().
const UIContext = createContext(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI tem de ser usado dentro de <UIProvider>.');
  return ctx;
}

const CORES = {
  success: '#10b981',
  error: '#ef4444',
  info: '#3b82f6',
  warning: '#f59e0b',
};

let idSeq = 0;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, cancelLabel, danger, resolve }

  const removerToast = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id));
  }, []);

  // Mostra um toast. tipo: 'success' | 'error' | 'info' | 'warning'.
  const notify = useCallback((message, tipo = 'info', duracao = 4000) => {
    const id = ++idSeq;
    setToasts((lista) => [...lista, { id, message, tipo }]);
    if (duracao > 0) setTimeout(() => removerToast(id), duracao);
    return id;
  }, [removerToast]);

  // Abre um diálogo de confirmação. Aceita uma string ou um objeto de opções.
  const confirm = useCallback((opts) => {
    const options = typeof opts === 'string' ? { message: opts } : (opts || {});
    return new Promise((resolve) => setDialog({ ...options, resolve }));
  }, []);

  const responder = useCallback((resultado) => {
    setDialog((d) => {
      if (d) d.resolve(resultado);
      return null;
    });
  }, []);

  // Fechar o diálogo com a tecla Escape (= cancelar).
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => { if (e.key === 'Escape') responder(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, responder]);

  return (
    <UIContext.Provider value={{ notify, confirm }}>
      {children}

      {/* Toasts */}
      <div style={estilos.toastWrap} aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} style={{ ...estilos.toast, borderLeft: `4px solid ${CORES[t.tipo] || CORES.info}` }} role="status">
            <span style={{ ...estilos.toastDot, backgroundColor: CORES[t.tipo] || CORES.info }} />
            <span style={estilos.toastMsg}>{t.message}</span>
            <button onClick={() => removerToast(t.id)} style={estilos.toastClose} aria-label="Fechar notificação">×</button>
          </div>
        ))}
      </div>

      {/* Diálogo de confirmação */}
      {dialog && (
        <div style={estilos.overlay} onClick={() => responder(false)} role="dialog" aria-modal="true">
          <div style={estilos.dialog} onClick={(e) => e.stopPropagation()}>
            <h3 style={estilos.dialogTitle}>{dialog.title || 'Confirmar ação'}</h3>
            <p style={estilos.dialogMsg}>{dialog.message}</p>
            <div style={estilos.dialogBtns}>
              <button onClick={() => responder(false)} style={estilos.btnCancel}>
                {dialog.cancelLabel || 'Cancelar'}
              </button>
              <button
                onClick={() => responder(true)}
                style={{ ...estilos.btnConfirm, backgroundColor: dialog.danger ? CORES.error : CORES.info }}
                autoFocus
              >
                {dialog.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

const estilos = {
  toastWrap: { position: 'fixed', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 9999, maxWidth: '360px' },
  toast: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1f2937', color: '#fff', padding: '12px 14px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', fontSize: '14px', animation: 'fadeIn 0.2s ease' },
  toastDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  toastMsg: { flex: 1, lineHeight: 1.4 },
  toastClose: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', lineHeight: 1, cursor: 'pointer', padding: 0 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px' },
  dialog: { backgroundColor: '#1f2937', color: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fadeInUp 0.2s ease' },
  dialogTitle: { margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' },
  dialogMsg: { margin: '0 0 24px 0', fontSize: '14px', color: '#d1d5db', lineHeight: 1.6, whiteSpace: 'pre-line' },
  dialogBtns: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  btnCancel: { padding: '10px 18px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: 'transparent', color: '#d1d5db', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  btnConfirm: { padding: '10px 18px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
};

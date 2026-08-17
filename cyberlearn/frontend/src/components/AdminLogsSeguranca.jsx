import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useTranslation } from '../i18n';

// Os rótulos são chaves i18n resolvidas com t() na renderização.
const TIPOS = [
  { valor: '',              labelKey: 'adminx.logsTipoTodos' },
  { valor: 'login_sucesso', labelKey: 'adminx.logsTipoLoginOk' },
  { valor: 'login_falha',   labelKey: 'adminx.logsTipoLoginFalha' },
  { valor: '2fa_falha',     labelKey: 'adminx.logsTipo2faFalha' },
];

const BADGE = {
  login_sucesso: { cor: '#10b981', labelKey: 'adminx.logsBadgeSucesso',     icone: '✅' },
  login_falha:   { cor: '#ef4444', labelKey: 'adminx.logsBadgeLoginFalhou', icone: '⛔' },
  '2fa_falha':   { cor: '#f59e0b', labelKey: 'adminx.logsBadge2faFalhou',   icone: '⚠️' },
};

// Ecrã de auditoria: mostra a tabela logs_seguranca que o servidor
// sempre alimentou (logins, falhas de password e de 2FA) mas nunca expôs.
export default function AdminLogsSeguranca({ theme }) {
  const t = useTranslation();
  const [registos, setRegistos] = useState([]);
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // `erro` guarda a mensagem da API ou uma chave i18n; na renderização
  // aplicamos t(erro) — se não for uma chave conhecida, t devolve o texto tal e qual.
  const carregar = useCallback(async (tipoFiltro) => {
    setLoading(true);
    setErro(null);
    try {
      const query = tipoFiltro ? `?tipo=${encodeURIComponent(tipoFiltro)}` : '';
      const res = await apiFetch(`/admin/logs-seguranca${query}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setRegistos(data);
      else setErro(data?.erro || 'adminx.logsLoadError');
    } catch {
      setErro('adminx.connError');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(tipo); }, [tipo, carregar]);

  const styles = {
    container: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' },
    select: { backgroundColor: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: theme.textMain, fontSize: '13px' },
    th: { padding: '10px 12px', color: theme.textSub, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.inputBorder}` },
    td: { padding: '12px', borderBottom: `1px solid ${theme.inputBorder}40` },
    badge: (cor) => ({ backgroundColor: `${cor}18`, color: cor, border: `1px solid ${cor}40`, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }),
    vazio: { backgroundColor: theme.inputBg, padding: '30px', borderRadius: '12px', textAlign: 'center', color: theme.textSub, fontSize: '14px', border: `1px dashed ${theme.inputBorder}` },
    btnRetry: { backgroundColor: theme.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '12px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.toolbar}>
          <h2 style={{ fontSize: '18px', color: theme.textMain, margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            {t('adminx.logsTitle')}
          </h2>
          <label htmlFor="logs-filtro-tipo" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>
            {t('adminx.logsFilterLabel')}
            <select id="logs-filtro-tipo" style={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map(op => <option key={op.valor} value={op.valor}>{t(op.labelKey)}</option>)}
            </select>
          </label>
        </div>

        {loading ? (
          <div style={styles.vazio}>{t('adminx.logsLoading')}</div>
        ) : erro ? (
          <div style={styles.vazio}>
            <p style={{ margin: 0, color: theme.danger, fontWeight: 'bold' }}>{t(erro)}</p>
            <button type="button" style={styles.btnRetry} onClick={() => carregar(tipo)}>{t('adminx.retry')}</button>
          </div>
        ) : registos.length === 0 ? (
          <div style={styles.vazio}>{t('adminx.logsEmpty')}</div>
        ) : (
          <div className="cl-table-wrap">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t('adminx.logsColEvento')}</th>
                  <th style={styles.th}>{t('adminx.logsColUtilizador')}</th>
                  <th style={styles.th}>{t('adminx.logsColEmail')}</th>
                  <th style={styles.th}>{t('adminx.logsColIp')}</th>
                  <th style={styles.th}>{t('adminx.logsColData')}</th>
                </tr>
              </thead>
              <tbody>
                {registos.map(r => {
                  // r.tipo vem da API e fica por traduzir quando não há badge conhecida
                  const badge = BADGE[r.tipo] || { cor: theme.textSub, label: r.tipo, icone: '•' };
                  return (
                    <tr key={r.id}>
                      <td style={styles.td}><span style={styles.badge(badge.cor)}>{badge.icone} {badge.labelKey ? t(badge.labelKey) : badge.label}</span></td>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{r.nome || '—'}</td>
                      <td style={styles.td}>{r.email || '—'}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>{r.ip || '—'}</td>
                      <td style={styles.td}>{r.data}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

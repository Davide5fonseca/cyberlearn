import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';

const TIPOS = [
  { valor: '',              label: 'Todos' },
  { valor: 'login_sucesso', label: 'Logins com sucesso' },
  { valor: 'login_falha',   label: 'Falhas de login' },
  { valor: '2fa_falha',     label: 'Falhas de 2FA' },
];

const BADGE = {
  login_sucesso: { cor: '#10b981', label: 'Sucesso',    icone: '✅' },
  login_falha:   { cor: '#ef4444', label: 'Login falhou', icone: '⛔' },
  '2fa_falha':   { cor: '#f59e0b', label: '2FA falhou',  icone: '⚠️' },
};

// Ecrã de auditoria: mostra a tabela logs_seguranca que o servidor
// sempre alimentou (logins, falhas de password e de 2FA) mas nunca expôs.
export default function AdminLogsSeguranca({ theme }) {
  const [registos, setRegistos] = useState([]);
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (tipoFiltro) => {
    setLoading(true);
    setErro(null);
    try {
      const query = tipoFiltro ? `?tipo=${encodeURIComponent(tipoFiltro)}` : '';
      const res = await apiFetch(`/admin/logs-seguranca${query}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setRegistos(data);
      else setErro(data?.erro || 'Não foi possível carregar os registos.');
    } catch {
      setErro('Erro de ligação ao servidor.');
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
    tableWrap: { overflowX: 'auto' },
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Registos de Segurança
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>
            Filtrar por tipo
            <select style={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar registos por tipo">
              {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
          </label>
        </div>

        {loading ? (
          <div style={styles.vazio}>A carregar registos…</div>
        ) : erro ? (
          <div style={styles.vazio}>
            <p style={{ margin: 0, color: theme.danger, fontWeight: 'bold' }}>{erro}</p>
            <button type="button" style={styles.btnRetry} onClick={() => carregar(tipo)}>Tentar novamente</button>
          </div>
        ) : registos.length === 0 ? (
          <div style={styles.vazio}>Sem registos para este filtro.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Evento</th>
                  <th style={styles.th}>Utilizador</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>IP</th>
                  <th style={styles.th}>Data</th>
                </tr>
              </thead>
              <tbody>
                {registos.map(r => {
                  const badge = BADGE[r.tipo] || { cor: theme.textSub, label: r.tipo, icone: '•' };
                  return (
                    <tr key={r.id}>
                      <td style={styles.td}><span style={styles.badge(badge.cor)}>{badge.icone} {badge.label}</span></td>
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

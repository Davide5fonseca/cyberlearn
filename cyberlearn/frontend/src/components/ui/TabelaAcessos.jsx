import { useTranslation } from '../../i18n';

// Tabela de registos de acesso partilhada pelos dashboards do Admin e do
// Professor (vista resumida e histórico completo). Concentra o cabeçalho,
// a célula com avatar/inicial, o badge de estado e os estados de
// "a carregar" / vazio, que antes estavam duplicados quatro vezes.
export default function TabelaAcessos({ theme, acessos, cabecalhos, textoVazio, loading = false, textoCarregar }) {
  const t = useTranslation();

  const styles = {
    tableHeaderRow: { borderBottom: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg },
    th: { padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: theme.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' },
    td: { padding: '16px 24px', fontSize: '14px', color: theme.textMain, borderBottom: `1px solid ${theme.inputBorder}60` },
    // Todos os registos apresentados são logins bem-sucedidos, por isso o
    // badge usa sempre a variante de sucesso.
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: `${theme.success}15`, color: theme.success, display: 'inline-flex', alignItems: 'center', gap: '4px' },
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.cardBg, zIndex: 1, boxShadow: `0 1px 0 ${theme.inputBorder}` }}>
          <tr style={styles.tableHeaderRow}>
            {cabecalhos.map((cabecalho, i) => (
              <th key={cabecalho} style={i === 0 ? { ...styles.th, paddingLeft: '32px' } : styles.th}>{cabecalho}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={cabecalhos.length} style={{ padding: '64px 24px', textAlign: 'center', color: theme.textSub }}>{textoCarregar}</td>
            </tr>
          ) : acessos.length > 0 ? acessos.map(acesso => (
            <tr key={acesso.id} style={{ transition: 'background-color 0.2s' }}>
              <td style={{ ...styles.td, paddingLeft: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, backgroundImage: theme.gradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', overflow: 'hidden' }}>
                    {/* Desenha a foto ou a inicial */}
                    {acesso.avatar ? (
                      <img src={acesso.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      acesso.nome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span style={{ fontWeight: '600' }}>{acesso.nome}</span>
                </div>
              </td>
              <td style={styles.td}>{acesso.email}</td>
              <td style={{ ...styles.td, color: theme.textSub }}>{acesso.data}</td>
              <td style={styles.td}>
                <div style={styles.badge}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                  {t('common.success')}
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={cabecalhos.length} style={{ padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ color: theme.textSub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  <span>{textoVazio}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

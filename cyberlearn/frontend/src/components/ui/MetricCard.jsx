// Cartão de métrica (ícone + etiqueta + valor) partilhado pelos dashboards
// do Admin e do Professor. `cor` e `corFundo` permitem variar o ícone
// mantendo o resto do cartão idêntico.
export default function MetricCard({ theme, icone, etiqueta, valor, cor, corFundo }) {
  const styles = {
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    iconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: corFundo || theme.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: cor || theme.primary },
  };

  return (
    <div style={styles.card}>
      {/* O ícone é decorativo — a informação está na etiqueta e no valor. */}
      <div style={styles.iconBox} aria-hidden="true">
        {icone}
      </div>
      <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{etiqueta}</p>
      <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>{valor}</h3>
    </div>
  );
}

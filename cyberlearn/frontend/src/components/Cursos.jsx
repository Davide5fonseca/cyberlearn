export default function Cursos({ setView, theme }) {
  const styles = {
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    courseCard: { backgroundColor: theme.cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: theme.shadow, transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: `${theme.success}20`, color: theme.success },
    submitButton: { width: '100%', backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', textTransform: 'uppercase' }
  };

  return (
    <div style={styles.courseGrid}>
      <div style={styles.courseCard}>
        <div style={{width: '100%', height: '140px', backgroundColor: theme.inputBg, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>
        </div>
        <div style={{padding: '20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
          <div style={{...styles.badge, alignSelf: 'flex-start'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> Iniciante</div>
          <h4 style={{fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '10px 0 5px 0'}}>Ataques de Phishing</h4>
          <p style={{fontSize: '13px', color: theme.textSub, margin: '0 0 20px 0', lineHeight: '1.4'}}>Aprende a identificar táticas de engenharia social, emails falsos e como proteger a tua organização de esquemas comuns.</p>
          <button style={{...styles.submitButton, marginTop: 'auto'}} onClick={() => setView('licao')}>Começar Curso</button>
        </div>
      </div>

      <div style={styles.courseCard}>
        <div style={{width: '100%', height: '140px', backgroundColor: theme.inputBg, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div style={{padding: '20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
          <div style={{...styles.badge, backgroundColor: `${theme.warning}20`, color: theme.warning, alignSelf: 'flex-start'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Intermédio</div>
          <h4 style={{fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '10px 0 5px 0'}}>Criptografia Aplicada</h4>
          <p style={{fontSize: '13px', color: theme.textSub, margin: '0 0 20px 0', lineHeight: '1.4'}}>Descobre como funcionam os algoritmos de encriptação modernos (AES, RSA) e o conceito de chaves públicas e privadas.</p>
          <button style={{...styles.submitButton, marginTop: 'auto', backgroundColor: theme.inputBg, color: theme.textMain, boxShadow: 'none'}} onClick={() => alert("Brevemente!")}>Bloqueado</button>
        </div>
      </div>
    </div>
  );
}
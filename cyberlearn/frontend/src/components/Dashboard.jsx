export default function Dashboard({ theme }) {
  const styles = {
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' },
    statCard: { backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.3s ease' },
    statNumber: { fontSize: '24px', fontWeight: 'bold', color: theme.textMain, margin: 0 },
    statLabel: { fontSize: '11px', color: theme.textSub, textTransform: 'uppercase', marginTop: '4px', fontWeight: '600' },
    sectionTitle: { fontSize: '18px', color: theme.textMain, marginBottom: '15px', fontWeight: 'bold' },
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    courseCard: { backgroundColor: theme.cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: theme.shadow, transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column' }
  };

  return (
    <>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{padding: '12px', backgroundColor: `${theme.primary}20`, borderRadius: '10px', color: theme.primary}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div><h3 style={styles.statNumber}>3</h3><p style={styles.statLabel}>Módulos Concluídos</p></div>
        </div>
        <div style={styles.statCard}>
          <div style={{padding: '12px', backgroundColor: '#8b5cf620', borderRadius: '10px', color: '#8b5cf6'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <div><h3 style={styles.statNumber}>1,250</h3><p style={styles.statLabel}>Pontuação Total</p></div>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Os Teus Cursos Ativos</h2>
      <div style={styles.courseGrid}>
        <div style={styles.courseCard}>
          <div style={{width: '100%', height: '120px', backgroundColor: theme.inputBg, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line></svg>
          </div>
          <div style={{padding: '15px'}}>
            <h4 style={{fontSize: '16px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 5px 0'}}>Ataques de Phishing</h4>
            <p style={{fontSize: '12px', color: theme.textSub, margin: 0}}>Módulo 1: Engenharia Social</p>
            <div style={{width: '100%', height: '6px', backgroundColor: theme.inputBg, borderRadius: '3px', marginTop: '15px', overflow: 'hidden'}}><div style={{width: '65%', height: '100%', backgroundColor: theme.primary, borderRadius: '3px'}}></div></div>
          </div>
        </div>
      </div>
    </>
  );
}
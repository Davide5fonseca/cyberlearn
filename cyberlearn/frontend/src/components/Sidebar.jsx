export default function Sidebar({ view, setView, handleLogout, theme, user }) {
  const isProfessor = user?.tipo === 'professor';
  const isAdmin = user?.tipo === 'admin';

  const styles = {
    sidebar: { width: '220px', backgroundColor: theme.sidebarBg, padding: '15px', display: 'flex', flexDirection: 'column', boxShadow: theme.shadow, transition: 'all 0.3s ease', zIndex: 10 },
    sidebarMenu: { flex: 1, marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '4px' },
    menuItem: (active) => ({ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: active ? 'white' : theme.textSub, backgroundColor: active ? theme.primary : 'transparent', fontWeight: active ? '600' : '500', transition: 'all 0.2s', fontSize: '12px' }),
    // Removi o fundo azul antigo e preparei a caixa para receber a tua imagem
    logoContainer: { width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, boxShadow: theme.shadow }
  };

  const getIconSize = () => 16;

  return (
    <div style={styles.sidebar}>
      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
        {/* AQUI ESTÁ A TUA IMAGEM A SUBSTITUIR O ESCUDO */}
        <div style={styles.logoContainer}>
           <img src="/Gemini_Generated_Image_b082ehb082ehb082.png" alt="CyberLearn Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h2 style={{color: theme.textMain, margin: 0, fontSize: '16px', fontWeight: 'bold'}}>CyberLearn</h2>
      </div>

      <div style={styles.sidebarMenu}>
        {isAdmin ? (
          <>
            <div style={styles.menuItem(view === 'admin_dashboard')} onClick={() => setView('admin_dashboard')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Painel Admin
            </div>
            <div style={styles.menuItem(view === 'admin_professores')} onClick={() => setView('admin_professores')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Professores
            </div>
          </>
        ) : isProfessor ? (
          <>
            <div style={styles.menuItem(view === 'professor_dashboard')} onClick={() => setView('professor_dashboard')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Painel Geral
            </div>
            <div style={styles.menuItem(view === 'professor_alunos')} onClick={() => setView('professor_alunos')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Alunos
            </div>
            <div style={styles.menuItem(view === 'professor_cursos')} onClick={() => setView('professor_cursos')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> Gerir Cursos
            </div>
          </>
        ) : (
          <>
            <div style={styles.menuItem(view === 'dashboard')} onClick={() => setView('dashboard')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Dashboard
            </div>
            <div style={styles.menuItem(view === 'cursos' || view === 'licao')} onClick={() => setView('cursos')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> Cursos
            </div>
            <div style={styles.menuItem(view === 'quizzes')} onClick={() => setView('quizzes')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Quizzes
            </div>
          </>
        )}

        <div style={styles.menuItem(view === 'profile')} onClick={() => setView('profile')}>
          <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Perfil
        </div>
      </div>

      <div style={{...styles.menuItem(false), color: theme.danger, marginTop: 'auto'}} onClick={handleLogout}>
        <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Sair da Conta
      </div>
    </div>
  );
}
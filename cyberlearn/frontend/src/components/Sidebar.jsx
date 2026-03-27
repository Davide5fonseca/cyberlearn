import { useState } from 'react';

const translations = {
  pt: {
    // ALTERAÇÕES FEITAS AQUI (Para o Administrador):
    'sidebar.adminPlatform': 'Dashboard', 
    'sidebar.adminUsers': 'Professores',
    'sidebar.profile': 'Perfil',
    
    // Restantes traduções (Professores e Alunos):
    'sidebar.profAnalytics': 'Painel Geral',
    'sidebar.profStudents': 'Alunos',
    'sidebar.profStudio': 'Gerir Cursos',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.courses': 'Cursos',
    'sidebar.quizzes': 'Quizzes',
    'sidebar.logout': 'Sair da Conta'
  }
};

export default function Sidebar({ view, setView, handleLogout, theme, user }) {

  const [lang] = useState('pt');
  const t = (key) => translations[lang][key] || key;

  const isProfessor = user?.tipo === 'professor';
  const isAdmin = user?.tipo === 'admin';

  const styles = {
    sidebar: { 
      width: '260px', 
      padding: '24px 16px', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: theme.sidebarBg,
      borderRight: `1px solid ${theme.inputBorder}`,
      height: '100vh', 
      boxSizing: 'border-box'
    },
    sidebarMenu: { flex: 1, marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '4px' },
    menuItem: (active) => ({ 
      padding: '10px 14px', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      color: active ? theme.primary : theme.textSub, 

      backgroundColor: active ? (theme.primarySoft || `${theme.primary}15`) : 'transparent', 
      fontWeight: active ? '600' : '500', 
      transition: 'all 0.15s ease', 
      fontSize: '14px', 
    }),
    logoContainer: { 
      width: '32px', 
      height: '32px', 
      borderRadius: '8px', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden', 
      backgroundColor: theme.primary,
      color: '#fff',
      flexShrink: 0
    }
  };

  const getIconSize = () => 18;

  return (
    <div style={styles.sidebar}>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px'}}>
        <div style={styles.logoContainer}>
           <img src="/Gemini_Generated_Image_b082ehb082ehb082.png" alt="CyberLearn Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h2 style={{color: theme.textMain, margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px'}}>CyberLearn</h2>
      </div>

      <div style={styles.sidebarMenu}>

        {isAdmin ? (
          <>
            <div className="table-row" style={styles.menuItem(view === 'admin_dashboard')} onClick={() => setView('admin_dashboard')} onMouseEnter={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> {t('sidebar.adminPlatform')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'admin_professores')} onClick={() => setView('admin_professores')} onMouseEnter={(e) => view !== 'admin_professores' && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => view !== 'admin_professores' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> {t('sidebar.adminUsers')}
            </div>
          </>
        ) : isProfessor ? (
          <>
            <div className="table-row" style={styles.menuItem(view === 'professor_dashboard')} onClick={() => setView('professor_dashboard')} onMouseEnter={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> {t('sidebar.profAnalytics')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'professor_alunos')} onClick={() => setView('professor_alunos')} onMouseEnter={(e) => view !== 'professor_alunos' && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => view !== 'professor_alunos' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> {t('sidebar.profStudents')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'professor_cursos')} onClick={() => setView('professor_cursos')} onMouseEnter={(e) => view !== 'professor_cursos' && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => view !== 'professor_cursos' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> {t('sidebar.profStudio')}
            </div>
          </>
        ) : (
          <>
            <div className="table-row" style={styles.menuItem(view === 'dashboard')} onClick={() => setView('dashboard')} onMouseEnter={(e) => view !== 'dashboard' && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => view !== 'dashboard' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> {t('sidebar.dashboard')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'cursos' || view === 'licao')} onClick={() => setView('cursos')} onMouseEnter={(e) => (view !== 'cursos' && view !== 'licao') && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => (view !== 'cursos' && view !== 'licao') && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> {t('sidebar.courses')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'quizzes')} onClick={() => setView('quizzes')} onMouseEnter={(e) => view !== 'quizzes' && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => view !== 'quizzes' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> {t('sidebar.quizzes')}
            </div>
          </>
        )}

        <div className="table-row" style={styles.menuItem(view === 'profile')} onClick={() => setView('profile')} onMouseEnter={(e) => view !== 'profile' && (e.currentTarget.style.backgroundColor = theme.iconBg)} onMouseLeave={(e) => view !== 'profile' && (e.currentTarget.style.backgroundColor = 'transparent')}>
          <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> {t('sidebar.profile')}
        </div>
      </div>
      
      {/* ---------------------------------------------------- */}
      {/* BLOCO DE PERFIL E SAIR (FUNDO DA SIDEBAR) */}
      {/* ---------------------------------------------------- */}
      <div style={{ paddingTop: '20px', borderTop: `1px solid ${theme.inputBorder}`, marginTop: 'auto' }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: theme.inputBg,
            borderRadius: '12px',
            border: `1px solid transparent`
          }}
        >
          {/* Avatar do Utilizador */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: theme.primary,
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.nome?.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          {/* Nome e Email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: theme.textMain, fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nome || 'Utilizador'}
            </p>
            <p style={{ margin: '2px 0 0 0', color: theme.textSub, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'email@exemplo.com'}
            </p>
          </div>

          {/* Ícone de Sair (Porta) */}
          <div 
            onClick={handleLogout}
            title="Terminar Sessão"
            style={{ 
              color: theme.danger, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '6px', 
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>

    </div>
  );
}
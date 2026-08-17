import { useCallback, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { useIsMobile } from '../hooks/useIsMobile';
import { VIEW_PATHS, PATH_VIEWS, VIEW_META } from './VIEW_META';

// Layout autenticado: Sidebar + cabeçalho + conteúdo da rota.
// Expõe um adaptador setView(nome) → navigate(caminho) para os componentes
// existentes continuarem a funcionar sem alterações durante a migração.
export default function AppLayout() {
  const { user, perfil, logout } = useAuth();
  const { theme, isDarkMode, setIsDarkMode } = useTheme();
  const { t, lang, setLang } = useI18n();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  // Estado partilhado entre páginas (lição aberta e quiz-alvo vindo de uma lição).
  const [activeCourse, setActiveCourse] = useState(null);
  const [targetQuizCourse, setTargetQuizCourse] = useState(null);

  const view = PATH_VIEWS[location.pathname] || 'dashboard';

  const setView = useCallback((nome) => {
    navigate(VIEW_PATHS[nome] || '/dashboard');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setActiveCourse(null);
    setTargetQuizCourse(null);
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const meta = VIEW_META[view];
  const primeiroNome = user?.nome?.split(' ')[0] ?? '';
  const titulo = meta?.saudacao ? `${t('layout.ola')}, ${primeiroNome}` : meta?.titulo ? t(meta.titulo) : '';
  const subtitulo = meta?.sub ? t(meta.sub) : '';

  const outletContext = {
    theme, user, perfil, setView, isMobile,
    activeCourse, setActiveCourse,
    targetQuizCourse, setTargetQuizCourse
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', width: '100%', backgroundColor: 'transparent', overflow: 'hidden' }}>

      <Sidebar view={view} setView={setView} handleLogout={handleLogout} theme={theme} user={user} isMobile={isMobile} />

      <div style={{ flex: 1, padding: isMobile ? '15px' : '20px 30px', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden', height: isMobile ? 'calc(100vh - 65px)' : '100vh',
        background: isDarkMode
          ? `radial-gradient(900px circle at 10% -8%, rgba(59,130,246,0.13), transparent 45%), radial-gradient(820px circle at 98% 112%, rgba(34,211,238,0.11), transparent 45%), linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px) 0 0/100% 44px, linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px) 0 0/44px 100%, ${theme.bg}`
          : `radial-gradient(900px circle at 10% -8%, rgba(59,130,246,0.06), transparent 45%), radial-gradient(820px circle at 98% 112%, rgba(34,211,238,0.05), transparent 45%), ${theme.bg}` }}>

        {view !== 'licao' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '20px', gap: isMobile ? '15px' : '0' }}>
            <div style={{ width: '100%' }}>
              <h1 style={{ fontSize: isMobile ? '18px' : '20px', color: theme.textMain, margin: 0, fontWeight: 'bold' }}>{titulo}</h1>
              <p style={{ color: theme.textSub, margin: '2px 0 0 0', fontSize: '12px' }}>{subtitulo}</p>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
              <button
                type="button"
                onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
                title={t('layout.idioma')}
                aria-label={t('layout.idioma')}
                style={{ backgroundColor: theme.iconBg, minWidth: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', color: theme.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', border: 'none', padding: '0 8px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.5px' }}
              >
                {lang === 'pt' ? 'EN' : 'PT'}
              </button>

              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? t('layout.temaClaro') : t('layout.temaEscuro')}
                aria-label={isDarkMode ? t('layout.temaClaro') : t('layout.temaEscuro')}
                aria-pressed={isDarkMode}
                style={{ backgroundColor: theme.iconBg, width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', color: theme.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', border: 'none', padding: 0 }}
              >
                {isDarkMode
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
              </button>

              <button
                type="button"
                onClick={() => navigate('/perfil')}
                title={t('layout.perfil')}
                aria-label={t('layout.perfil')}
                style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: theme.primary, backgroundImage: theme.gradient, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: `0 4px 10px ${theme.primary}50`, transition: 'transform 0.2s ease', overflow: 'hidden', border: 'none', padding: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.nome?.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        )}

        <Outlet context={outletContext} />
      </div>
    </div>
  );
}

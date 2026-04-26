import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';

const translations = {
  pt: {
    'sidebar.adminPlatform': 'Dashboard', 
    'sidebar.adminUsers': 'Professores',
    'sidebar.adminAprovacoes': 'Aprovações',
    'sidebar.profile': 'Perfil',
    
    'sidebar.profAnalytics': 'Dashboard', 
    'sidebar.profStudents': 'Turmas',
    'sidebar.profStudio': 'Cursos',
    
    'sidebar.dashboard': 'Dashboard',
    'sidebar.courses': 'Cursos',
    'sidebar.quizzes': 'Quizzes',
    'sidebar.labs': 'Labs',
    'sidebar.logout': 'Sair da Conta'
  }
};

export default function Sidebar({ view, setView, handleLogout, theme, user, isMobile }) {

  const [lang] = useState('pt');
  const t = (key) => translations[lang][key] || key;

  const isProfessor = user?.tipo === 'professor';
  const isAdmin = user?.tipo === 'admin';

  // ESTADOS DO CENTRO DE NOTIFICAÇÕES
  const [notificacoes, setNotificacoes] = useState([]);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [lidas, setLidas] = useState([]);

  // Refs para detetar clique fora do painel
  const notifPainelRef = useRef(null);
  const notifBotaoRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      buscarNotificacoes();
      const lidasGuardadas = localStorage.getItem(`notificacoes_lidas_${user.id}`);
      if (lidasGuardadas) {
        setLidas(JSON.parse(lidasGuardadas));
      }
    }
  }, [user]);

  // Fechar painel ao clicar fora (click-outside)
  useEffect(() => {
    if (!mostrarNotificacoes) return;
    const handleClickFora = (e) => {
      // Se o clique foi fora do painel E fora do botão sino, fecha
      if (
        notifPainelRef.current && !notifPainelRef.current.contains(e.target) &&
        notifBotaoRef.current && !notifBotaoRef.current.contains(e.target)
      ) {
        setMostrarNotificacoes(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [mostrarNotificacoes]);

  const buscarNotificacoes = async () => {
    try {
      const res = await apiFetch(`/notificacoes/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações", err);
    }
  };

  const lerNotificacao = (notificacao) => {
    // Marcar como lida
    const novasLidas = [...lidas, notificacao.id];
    setLidas(novasLidas);
    localStorage.setItem(`notificacoes_lidas_${user.id}`, JSON.stringify(novasLidas));

    // Fechar o painel de notificações
    setMostrarNotificacoes(false);

    // Navegar para o destino da notificação
    if (notificacao.acao) {
      setView(notificacao.acao);
    }
  };

  const marcarTodasLidas = () => {
    const todasIds = notificacoes.map(n => n.id);
    setLidas(todasIds);
    localStorage.setItem(`notificacoes_lidas_${user.id}`, JSON.stringify(todasIds));
  };

  const notificacoesAtivas = notificacoes.filter(n => !lidas.includes(n.id));

  // Apaga a notificação sem navegar (só fecha/dismiss)
  const dispensarNotificacao = (e, id) => {
    e.stopPropagation(); // impede que o clique no X dispare o click do card
    const novasLidas = [...lidas, id];
    setLidas(novasLidas);
    localStorage.setItem(`notificacoes_lidas_${user.id}`, JSON.stringify(novasLidas));
  };

  // UI DO PAINEL DE NOTIFICAÇÕES
  const renderNotificacoes = () => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* CABEÇALHO */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: theme.textMain, fontSize: '15px' }}>Notificações</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {notificacoesAtivas.length > 0 && (
            <>
              <span style={{ fontSize: '11px', backgroundColor: theme.primary || '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                {notificacoesAtivas.length} novas
              </span>
              <button
                onClick={marcarTodasLidas}
                title="Apagar todas"
                style={{
                  background: 'none', border: `1px solid ${theme.inputBorder}`, color: theme.textSub,
                  fontSize: '11px', cursor: 'pointer', fontWeight: '600',
                  padding: '3px 8px', borderRadius: '6px'
                }}
              >
                Limpar tudo
              </button>
            </>
          )}
        </div>
      </div>

      {/* LISTA */}
      <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
        {notificacoesAtivas.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <p style={{ color: theme.textSub, fontSize: '14px', margin: 0 }}>Estás em dia! Sem novos avisos.</p>
          </div>
        ) : (
          notificacoesAtivas.map((n) => (
            <div
              key={n.id}
              onClick={() => lerNotificacao(n)}
              style={{
                display: 'flex', gap: '14px', padding: '14px 20px',
                borderBottom: `1px solid ${theme.inputBorder}30`,
                cursor: n.acao ? 'pointer' : 'default',
                transition: 'background-color 0.15s',
                position: 'relative',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Ícone */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: `${n.cor}18`, color: n.cor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '19px', border: `1px solid ${n.cor}25`, marginTop: '2px'
              }}>
                {n.icone}
              </div>

              {/* Conteúdo */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: '28px' }}>
                <h4 style={{ margin: '0 0 3px 0', fontSize: '13px', color: theme.textMain, fontWeight: '700' }}>{n.titulo}</h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: theme.textSub, lineHeight: '1.5' }}>{n.mensagem}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px', color: theme.textSub, fontWeight: '600',
                    backgroundColor: `${theme.inputBorder}40`, padding: '2px 7px', borderRadius: '5px'
                  }}>{n.data}</span>
                  {n.acao && (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: n.cor }}>
                      {n.labelAcao || 'Ver →'}
                    </span>
                  )}
                </div>
              </div>

              {/* BOTÃO X — apaga sem navegar */}
              <button
                onClick={(e) => dispensarNotificacao(e, n.id)}
                title="Dispensar notificação"
                style={{
                  position: 'absolute', top: '12px', right: '14px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.inputBorder}`,
                  color: theme.textSub,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '13px', lineHeight: 1,
                  padding: 0, transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.danger}15`;
                  e.currentTarget.style.borderColor = theme.danger;
                  e.currentTarget.style.color = theme.danger;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = theme.inputBorder;
                  e.currentTarget.style.color = theme.textSub;
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );



  // ==========================
  // BLOCO MOBILE
  // ==========================
  if (isMobile) {
    return (
      <>
        {/* JANELA FLUTUANTE DE NOTIFICAÇÕES (MOBILE) */}
        {mostrarNotificacoes && (
          <div
            ref={notifPainelRef}
            style={{
              position: 'fixed', bottom: '80px', left: '10px', right: '10px',
              backgroundColor: theme.cardBg, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: `1px solid ${theme.inputBorder}`, zIndex: 1001, overflow: 'hidden'
            }}
          >
             {renderNotificacoes()}
          </div>
        )}

        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: theme.sidebarBg,
          boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '10px 0',
          zIndex: 1000,
          borderTop: `1px solid ${theme.inputBorder}40`
        }}>
          
          {/* MENUS ESPECÍFICOS */}
          {isAdmin ? (
            <>
              <MobileNavIcon onClick={() => setView('admin_dashboard')} isActive={view === 'admin_dashboard'} icon={<><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></>} theme={theme} label={t('sidebar.adminPlatform')} />
              <MobileNavIcon onClick={() => setView('admin_professores')} isActive={view === 'admin_professores'} icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>} theme={theme} label={t('sidebar.adminUsers')} />
              <MobileNavIcon onClick={() => setView('admin_aprovacoes')} isActive={view === 'admin_aprovacoes'} icon={<><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></>} theme={theme} label={t('sidebar.adminAprovacoes')} />
            </>
          ) : isProfessor ? (
            <>
              <MobileNavIcon onClick={() => setView('professor_dashboard')} isActive={view === 'professor_dashboard'} icon={<><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></>} theme={theme} label={t('sidebar.profAnalytics')} />
              <MobileNavIcon onClick={() => setView('professor_alunos')} isActive={view === 'professor_alunos'} icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>} theme={theme} label={t('sidebar.profStudents')} />
              <MobileNavIcon onClick={() => setView('professor_cursos')} isActive={view === 'professor_cursos'} icon={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></>} theme={theme} label={t('sidebar.profStudio')} />
            </>
          ) : (
            <>
              <MobileNavIcon onClick={() => setView('dashboard')} isActive={view === 'dashboard'} icon={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></>} theme={theme} label={t('sidebar.dashboard')} />
              <MobileNavIcon onClick={() => setView('cursos')} isActive={view === 'cursos' || view === 'licao'} icon={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></>} theme={theme} label={t('sidebar.courses')} />
              <MobileNavIcon onClick={() => setView('quizzes')} isActive={view === 'quizzes'} icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></>} theme={theme} label={t('sidebar.quizzes')} />
            </>
          )}

          {/* SINO DE NOTIFICAÇÕES MOBILE */}
          <MobileNavIcon 
            onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)} 
            isActive={mostrarNotificacoes} 
            icon={
              <div style={{position: 'relative', display: 'flex'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {notificacoesAtivas.length > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: `2px solid ${theme.sidebarBg}` }}></span>}
              </div>
            } 
            theme={theme} 
            label="Avisos" 
          />

          {/* BOTÃO DE SAIR MOBILE */}
          <div onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.danger, cursor: 'pointer', padding: '5px', width: '60px' }}>
            <div style={{ padding: '8px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Sair</span>
          </div>
        </div>
      </>
    );
  }

  // ==========================
  // BLOCO DESKTOP
  // ==========================

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
      backgroundColor: 'transparent', 
      color: '#fff',
      flexShrink: 0
    }
  };

  const getIconSize = () => 18;

  return (
    <div style={styles.sidebar}>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px'}}>
        <div style={styles.logoContainer}>
           <img src="\security.png" alt="CyberLearn Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h2 style={{color: theme.textMain, margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px'}}>CyberLearn</h2>
      </div>

      <div style={styles.sidebarMenu}>

        {isAdmin ? (
          <>
            <div className="table-row" style={styles.menuItem(view === 'admin_dashboard')} onClick={() => setView('admin_dashboard')} onMouseEnter={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> {t('sidebar.adminPlatform')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'admin_professores')} onClick={() => setView('admin_professores')} onMouseEnter={(e) => view !== 'admin_professores' && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => view !== 'admin_professores' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> {t('sidebar.adminUsers')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'admin_aprovacoes')} onClick={() => setView('admin_aprovacoes')} onMouseEnter={(e) => view !== 'admin_aprovacoes' && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => view !== 'admin_aprovacoes' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg> {t('sidebar.adminAprovacoes')}
            </div>
          </>
        ) : isProfessor ? (
          <>
            <div className="table-row" style={styles.menuItem(view === 'professor_dashboard')} onClick={() => setView('professor_dashboard')} onMouseEnter={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => !view.includes('dashboard') && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> {t('sidebar.profAnalytics')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'professor_alunos')} onClick={() => setView('professor_alunos')} onMouseEnter={(e) => view !== 'professor_alunos' && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => view !== 'professor_alunos' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> {t('sidebar.profStudents')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'professor_cursos')} onClick={() => setView('professor_cursos')} onMouseEnter={(e) => view !== 'professor_cursos' && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => view !== 'professor_cursos' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> {t('sidebar.profStudio')}
            </div>
          </>
        ) : (
          <>
            <div className="table-row" style={styles.menuItem(view === 'dashboard')} onClick={() => setView('dashboard')} onMouseEnter={(e) => view !== 'dashboard' && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => view !== 'dashboard' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> {t('sidebar.dashboard')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'cursos' || view === 'licao')} onClick={() => setView('cursos')} onMouseEnter={(e) => (view !== 'cursos' && view !== 'licao') && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => (view !== 'cursos' && view !== 'licao') && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> {t('sidebar.courses')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'quizzes')} onClick={() => setView('quizzes')} onMouseEnter={(e) => view !== 'quizzes' && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => view !== 'quizzes' && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> {t('sidebar.quizzes')}
            </div>
            <div className="table-row" style={styles.menuItem(view === 'labs' || view === 'phishing' || view === 'ctf')} onClick={() => setView('labs')} onMouseEnter={(e) => !['labs','phishing','ctf'].includes(view) && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => !['labs','phishing','ctf'].includes(view) && (e.currentTarget.style.backgroundColor = 'transparent')}>
              <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v2m6-2h10m-6 0v2m0-2a2 2 0 0 0 2 2m0 0h2a2 2 0 0 0 2-2m0 0V9a2 2 0 0 0-2-2m0 0h-2"></path></svg> {t('sidebar.labs')}
            </div>
          </>
        )}

        <div className="table-row" style={styles.menuItem(view === 'profile')} onClick={() => setView('profile')} onMouseEnter={(e) => view !== 'profile' && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)} onMouseLeave={(e) => view !== 'profile' && (e.currentTarget.style.backgroundColor = 'transparent')}>
          <svg width={getIconSize()} height={getIconSize()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> {t('sidebar.profile')}
        </div>
      </div>
      
      {/* RODAPÉ DESKTOP (NOTIFICAÇÕES + PERFIL) */}
      <div style={{ paddingTop: '10px', borderTop: `1px solid ${theme.inputBorder}`, marginTop: 'auto', position: 'relative' }}>
        
        {/* JANELA FLUTUANTE DE NOTIFICAÇÕES (DESKTOP) */}
        {mostrarNotificacoes && (
          <div
            ref={notifPainelRef}
            style={{
              position: 'absolute', bottom: 'calc(100% + 10px)', left: '0',
              width: '360px',
              backgroundColor: theme.cardBg, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              border: `1px solid ${theme.inputBorder}`, zIndex: 100, overflow: 'hidden'
            }}
          >
             {renderNotificacoes()}
          </div>
        )}

        {/* BOTÃO SINO DE NOTIFICAÇÕES */}
        <div
          ref={notifBotaoRef}
          onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
          style={{
             display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
             cursor: 'pointer', borderRadius: '12px', marginBottom: '10px',
             backgroundColor: mostrarNotificacoes ? `${theme.primary}15` : 'transparent',
             color: mostrarNotificacoes ? theme.primary : theme.textMain,
             transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => !mostrarNotificacoes && (e.currentTarget.style.backgroundColor = theme.iconBg || `${theme.inputBorder}50`)}
          onMouseLeave={(e) => !mostrarNotificacoes && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              {notificacoesAtivas.length > 0 && (
                  <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: `2px solid ${theme.sidebarBg}` }}></span>
              )}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Avisos</span>
          {notificacoesAtivas.length > 0 && (
            <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
               {notificacoesAtivas.length}
            </span>
          )}
        </div>

        {/* CAIXA DO UTILIZADOR */}
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

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: theme.textMain, fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nome || 'Utilizador'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <p style={{ margin: 0, color: theme.textSub, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {user?.email || 'email@exemplo.com'}
              </p>
              {user?.streakCount > 0 && (
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#f97316', backgroundColor: '#f9731615', padding: '2px 6px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  🔥 {user.streakCount}
                </span>
              )}
            </div>
          </div>

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

function MobileNavIcon({ onClick, isActive, icon, theme, label }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isActive ? theme.primary : theme.textSub, cursor: 'pointer', padding: '5px', width: '60px' }}>
      <div style={{ backgroundColor: isActive ? `${theme.primary}15` : 'transparent', padding: '8px', borderRadius: '50%', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
        <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
          {icon}
        </div>
      </div>
      <span style={{ fontSize: '10px', fontWeight: isActive ? 'bold' : 'normal' }}>{label}</span>
    </div>
  );
}
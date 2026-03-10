import { useState, useEffect } from 'react';

function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  
  const [formData, setFormData] = useState({
    nome: '', email: '', password: '', confirmarPassword: '', tipo: 'aluno'
  });
  const [resetToken, setResetToken] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ==========================================
  // NOVOS ESTADOS PARA A PÁGINA DE PERFIL
  // ==========================================
  const [profileData, setProfileData] = useState({ nome: '', senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Atualiza o nome no formulário do perfil assim que o utilizador faz login
  useEffect(() => {
    if (user) setProfileData(prev => ({ ...prev, nome: user.nome }));
  }, [user]);

  // Força a cor de fundo do HTML inteiro
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#060b14' : '#f0f2f5';
    document.body.style.transition = 'background-color 0.3s ease';
  }, [isDarkMode]);

  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (path === '/reset-password' && token) {
      setView('reset');
      setResetToken(token);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setFormData({ ...formData, password: '' }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (view === 'reset') {
      if (formData.password !== formData.confirmarPassword) {
        alert("Erro: As palavras-passe não coincidem!");
        return;
      }
      try {
        const response = await fetch('http://localhost:8080/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, novaPassword: formData.password })
        });
        const data = await response.json();
        if (response.ok) {
          alert("Sucesso! " + data.mensagem);
          window.location.href = '/'; 
        } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }

    if (view === 'forgot') {
      try {
        const response = await fetch('http://localhost:8080/recuperar-senha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        const data = await response.json();
        if (response.ok) {
          alert("Se o email existir, receberás um link de recuperação.");
          setView('login');
        } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }

    if (view === 'register' && formData.password !== formData.confirmarPassword) {
      alert("Erro: As palavras-passe não coincidem!");
      return;
    }

    const endpoint = view === 'login' ? 'http://localhost:8080/login' : 'http://localhost:8080/registar';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        if (view === 'register') {
            alert(data.mensagem || 'Conta criada com sucesso!');
            setView('login');
            setFormData({ ...formData, password: '', confirmarPassword: '' });
        } else if (view === 'login') {
            setUser(data.utilizador);
            setView('dashboard');
        }
      } else { alert(`Erro: ${data.erro}`); }
    } catch (error) { alert("Erro de ligação ao servidor."); }
  };

  // ==========================================
  // FUNÇÃO: SALVAR ALTERAÇÕES DO PERFIL REAL
  // ==========================================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (profileData.novaSenha && profileData.novaSenha !== profileData.confirmarNovaSenha) {
      alert("Erro: As novas palavras-passe não coincidem!");
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/atualizar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          nome: profileData.nome,
          senhaAtual: profileData.senhaAtual,
          novaSenha: profileData.novaSenha
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("As tuas alterações foram guardadas com sucesso!");
        setUser({ ...user, nome: profileData.nome }); 
        setProfileData({ ...profileData, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' }); 
      } else {
        alert(`Erro: ${data.erro}`);
      }
    } catch (error) {
      alert("Erro de ligação ao servidor.");
    }
  };

  // ==========================================
  // CORES DINÂMICAS (TEMA)
  // ==========================================
  const theme = {
    bg: isDarkMode ? '#060b14' : '#f0f2f5', cardBg: isDarkMode ? '#171f2f' : '#ffffff', sidebarBg: isDarkMode ? '#111827' : '#ffffff', textMain: isDarkMode ? '#ffffff' : '#111827', textSub: isDarkMode ? '#9ca3af' : '#6b7280', inputBg: isDarkMode ? '#1f2937' : '#f9fafb', inputBorder: isDarkMode ? '#374151' : '#d1d5db', inputText: isDarkMode ? '#ffffff' : '#111827', shadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.05)', iconBg: isDarkMode ? '#1f2937' : '#f3f4f6', iconColor: isDarkMode ? '#facc15' : '#4b5563', primary: '#3b82f6', danger: '#ef4444', textUniversal: '#3b82f6', success: '#10b981'
  };

  const styles = {
    authContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', position: 'relative', padding: '10px 0' },
    topIcon: { position: 'absolute', top: '20px', right: '20px', backgroundColor: theme.iconBg, padding: '8px', borderRadius: '8px', cursor: 'pointer', color: theme.iconColor, transition: 'all 0.3s ease' },
    logoArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
    shieldIcon: { backgroundColor: theme.primary, width: '40px', height: '40px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: `0 0 20px ${theme.primary}80`, marginBottom: '10px' },
    mainTitle: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 2px 0', letterSpacing: '0.5px', color: theme.textMain },
    subTitle: { fontSize: '10px', color: theme.textUniversal, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0', textAlign: 'center' },
    card: { backgroundColor: theme.cardBg, padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '380px', boxSizing: 'border-box', boxShadow: theme.shadow, transition: 'all 0.3s ease' },
    inputWrapper: { marginBottom: '12px' },
    label: { display: 'block', fontSize: '10px', color: theme.textUniversal, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' },
    inputBox: { position: 'relative', display: 'flex', alignItems: 'center' },
    iconInside: { position: 'absolute', left: '12px', color: theme.textUniversal, width: '14px', height: '14px' },
    input: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '10px 10px 10px 34px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s ease' },
    radioGroup: { display: 'flex', gap: '20px', marginTop: '5px' },
    radioLabel: { fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain },
    submitButton: { width: '100%', backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: `0 4px 15px ${theme.primary}60`, textTransform: 'uppercase' },
    footerText: { marginTop: '20px', fontSize: '12px', color: theme.textUniversal, display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', justifyContent: 'center' },
    footerLink: { color: theme.primary, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' },

    dashLayout: { display: 'flex', height: '100vh', width: '100%', backgroundColor: 'transparent', overflow: 'hidden' },
    sidebar: { width: '240px', backgroundColor: theme.sidebarBg, padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: theme.shadow, transition: 'all 0.3s ease', zIndex: 10 },
    sidebarMenu: { flex: 1, marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '5px' },
    menuItem: (active) => ({ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: active ? 'white' : theme.textSub, backgroundColor: active ? theme.primary : 'transparent', fontWeight: active ? '600' : '500', transition: 'all 0.2s', fontSize: '13px' }),
    dashContent: { flex: 1, padding: '20px 30px', boxSizing: 'border-box', overflowY: 'auto', height: '100vh' },
    dashHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    welcomeText: { fontSize: '24px', color: theme.textMain, margin: 0, fontWeight: 'bold' },
    
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' },
    statCard: { backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.3s ease' },
    statNumber: { fontSize: '24px', fontWeight: 'bold', color: theme.textMain, margin: 0 },
    statLabel: { fontSize: '11px', color: theme.textSub, textTransform: 'uppercase', marginTop: '4px', fontWeight: '600' },
    sectionTitle: { fontSize: '18px', color: theme.textMain, marginBottom: '15px', fontWeight: 'bold' },
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' },
    courseCard: { backgroundColor: theme.cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: theme.shadow, transition: 'all 0.3s ease' },
    
    // Perfil Compacto - Sem Scroll
    profileLayout: { display: 'flex', gap: '20px', flexWrap: 'nowrap', alignItems: 'stretch' },
    profileLeft: { flex: '1', minWidth: '220px', backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    profileRight: { flex: '2', backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow },
    avatarBig: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', fontWeight: 'bold', marginBottom: '10px', boxShadow: `0 8px 20px ${theme.primary}60` },
    badge: { backgroundColor: `${theme.success}20`, color: theme.success, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', marginTop: '5px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px' },
    divider: { width: '100%', height: '1px', backgroundColor: theme.inputBorder, margin: '15px 0' },

    // Botão 2FA Interativo
    toggleBg: { width: '40px', height: '22px', backgroundColor: is2FAEnabled ? theme.primary : theme.inputBorder, borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease' },
    toggleCircle: { width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: is2FAEnabled ? '20px' : '2px', transition: 'all 0.3s ease' }
  };

  const renderThemeToggle = () => (
    <div style={['dashboard', 'profile'].includes(view) ? { backgroundColor: theme.iconBg, padding: '8px', borderRadius: '8px', cursor: 'pointer', color: theme.iconColor } : styles.topIcon} onClick={() => setIsDarkMode(!isDarkMode)}>
      {isDarkMode ? 
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> : 
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      }
    </div>
  );

  // ==========================================
  // ESTRUTURA PARTILHADA: DASHBOARD & PERFIL
  // ==========================================
  if (view === 'dashboard' || view === 'profile') {
    return (
      <div style={styles.dashLayout}>
        <div style={styles.sidebar}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div style={{...styles.shieldIcon, width: '35px', height: '35px', borderRadius: '8px', marginBottom: 0}}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h2 style={{color: theme.textMain, margin: 0, fontSize: '18px', fontWeight: 'bold'}}>CyberLearn</h2>
          </div>

          <div style={styles.sidebarMenu}>
            <div style={styles.menuItem(view === 'dashboard')} onClick={() => setView('dashboard')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Dashboard
            </div>
            <div style={styles.menuItem(false)} onClick={() => alert("Página de cursos a caminho!")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> Cursos
            </div>
            <div style={styles.menuItem(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Desafios (CTF)
            </div>
            <div style={styles.menuItem(view === 'profile')} onClick={() => setView('profile')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Perfil
            </div>
          </div>

          <div style={{...styles.menuItem(false), color: theme.danger, marginTop: 'auto'}} onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Sair da Conta
          </div>
        </div>

        <div style={styles.dashContent}>
          <div style={styles.dashHeader}>
            <div>
              <h1 style={styles.welcomeText}>
                {view === 'dashboard' ? `Olá, ${user ? user.nome.split(' ')[0] : 'Aluno'} 👋` : 'O Teu Perfil ⚙️'}
              </h1>
              <p style={{color: theme.textSub, margin: '4px 0 0 0', fontSize: '13px'}}>
                {view === 'dashboard' ? 'Bem-vindo de volta ao teu centro de treino.' : 'Gere a tua conta, segurança e progresso.'}
              </p>
            </div>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
              {renderThemeToggle()}
              <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', boxShadow: `0 4px 10px ${theme.primary}50`}}>
                {user ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>

          {/* DASHBOARD */}
          {view === 'dashboard' && (
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

              <h2 style={styles.sectionTitle}>Continuar a Aprender</h2>
              <div style={styles.courseGrid}>
                <div style={styles.courseCard}>
                  <div style={{width: '100%', height: '120px', backgroundColor: theme.inputBg, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line></svg>
                  </div>
                  <div style={{padding: '15px'}}>
                    <h4 style={{fontSize: '16px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 5px 0'}}>Fundamentos de Redes</h4>
                    <p style={{fontSize: '12px', color: theme.textSub, margin: 0}}>Módulo 2: Protocolos</p>
                    <div style={{width: '100%', height: '6px', backgroundColor: theme.inputBg, borderRadius: '3px', marginTop: '15px', overflow: 'hidden'}}><div style={{width: '65%', height: '100%', backgroundColor: theme.primary, borderRadius: '3px'}}></div></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PERFIL */}
          {view === 'profile' && (
            <div style={styles.profileLayout}>
              {/* Esquerda: Perfil info */}
              <div style={styles.profileLeft}>
                <div style={styles.avatarBig}>{user ? user.nome.charAt(0).toUpperCase() : 'U'}</div>
                <h2 style={{color: theme.textMain, margin: '0 0 5px 0', fontSize: '20px'}}>{user ? user.nome : 'Utilizador'}</h2>
                <p style={{color: theme.textSub, margin: '0 0 10px 0', fontSize: '13px'}}>{user ? user.email : 'email@exemplo.com'}</p>
                <div style={styles.badge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> Nível: Iniciante
                </div>
                <div style={styles.divider}></div>
                <div style={{width: '100%', textAlign: 'left'}}>
                  <p style={{color: theme.textSub, fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px'}}>As Tuas Estatísticas</p>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}><span style={{color: theme.textMain, fontSize: '13px'}}>Desafios CTF</span><span style={{color: theme.primary, fontWeight: 'bold', fontSize: '13px'}}>4 Resolvidos</span></div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}><span style={{color: theme.textMain, fontSize: '13px'}}>Rank Global</span><span style={{color: theme.primary, fontWeight: 'bold', fontSize: '13px'}}>#1,402</span></div>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{color: theme.textMain, fontSize: '13px'}}>Conta Ativa</span><span style={{color: theme.success, fontWeight: 'bold', fontSize: '13px'}}>Sim</span></div>
                </div>
              </div>

              {/* Direita: Formulário */}
              <div style={styles.profileRight}>
                <h3 style={{color: theme.textMain, fontSize: '16px', margin: '0 0 15px 0'}}>Detalhes da Conta</h3>
                <form onSubmit={handleSaveProfile}>
                  <div style={{display: 'flex', gap: '15px'}}>
                    <div style={{...styles.inputWrapper, flex: 1}}>
                      <label style={styles.label}>Nome de Exibição</label>
                      <input style={{...styles.input, padding: '10px'}} type="text" name="nome" value={profileData.nome} onChange={handleProfileChange} required />
                    </div>
                    <div style={{...styles.inputWrapper, flex: 1}}>
                      <label style={styles.label}>Endereço de Email</label>
                      <input style={{...styles.input, padding: '10px', opacity: 0.7}} type="email" value={user ? user.email : ''} readOnly title="Não é possível alterar." />
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  <h3 style={{color: theme.textMain, fontSize: '16px', margin: '0 0 15px 0'}}>Segurança</h3>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Palavra-Passe Atual</label>
                    <input style={{...styles.input, padding: '10px'}} type="password" name="senhaAtual" placeholder="Necessário para alterar" value={profileData.senhaAtual} onChange={handleProfileChange} />
                  </div>
                  <div style={{display: 'flex', gap: '15px'}}>
                    <div style={{...styles.inputWrapper, flex: 1}}>
                      <label style={styles.label}>Nova Palavra-Passe</label>
                      <input style={{...styles.input, padding: '10px'}} type="password" name="novaSenha" placeholder="Nova senha" value={profileData.novaSenha} onChange={handleProfileChange} />
                    </div>
                    <div style={{...styles.inputWrapper, flex: 1}}>
                      <label style={styles.label}>Confirmar Nova Palavra-Passe</label>
                      <input style={{...styles.input, padding: '10px'}} type="password" name="confirmarNovaSenha" placeholder="Confirmar" value={profileData.confirmarNovaSenha} onChange={handleProfileChange} />
                    </div>
                  </div>

                  {/* Switch 2FA Interativo */}
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px', padding: '12px', backgroundColor: theme.inputBg, borderRadius: '8px', border: `1px solid ${theme.inputBorder}`}}>
                    <div>
                      <p style={{color: theme.textMain, margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '13px'}}>Autenticação de Dois Fatores (2FA)</p>
                      <p style={{color: theme.textSub, margin: 0, fontSize: '11px'}}>Aumenta a segurança com verificação móvel.</p>
                    </div>
                    <div style={styles.toggleBg} onClick={() => setIs2FAEnabled(!is2FAEnabled)}>
                      <div style={styles.toggleCircle}></div>
                    </div>
                  </div>

                  <button type="submit" style={styles.submitButton}>Salvar Alterações</button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: AUTENTICAÇÃO (Login, Register, Forgot, Reset)
  // ==========================================
  
  if (view === 'reset') {
    return (
      <div style={styles.authContainer}>
        {renderThemeToggle()}
        <div style={styles.card}>
          <div style={styles.logoArea}>
            <div style={styles.shieldIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
            <h1 style={styles.mainTitle}>Nova Senha</h1>
            <p style={{...styles.subTitle, marginTop: '8px'}}>Cria uma nova palavra-passe segura.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Nova Palavra-Passe</label>
              <div style={styles.inputBox}>
                <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input style={styles.input} type="password" name="password" placeholder="........" value={formData.password} onChange={handleInputChange} required />
              </div>
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Confirmar Nova Palavra-Passe</label>
              <div style={styles.inputBox}>
                <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input style={styles.input} type="password" name="confirmarPassword" placeholder="........" value={formData.confirmarPassword} onChange={handleInputChange} required />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>Atualizar Palavra-Passe</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <div style={styles.authContainer}>
        {renderThemeToggle()}
        <div style={styles.card}>
          <div style={styles.logoArea}>
            <div style={styles.shieldIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
            <h1 style={styles.mainTitle}>Recuperar Senha</h1>
            <p style={{...styles.subTitle, marginTop: '8px'}}>Introduz o teu e-mail para receberes um link.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Endereço de E-mail</label>
              <div style={styles.inputBox}>
                <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
                <input style={styles.input} type="email" name="email" placeholder="exemplo@email.com" value={formData.email} onChange={handleInputChange} required />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>Enviar Link</button>
          </form>
          <div style={styles.footerText}>
            <span style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}} onClick={() => setView('login')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Voltar ao Login</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.authContainer}>
      {renderThemeToggle()}
      <div style={styles.logoArea}>
        <div style={styles.shieldIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
        <h1 style={styles.mainTitle}>CyberLearn</h1>
        <p style={styles.subTitle}>Plataforma de cibersegurança</p>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          {view === 'register' && (
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Nome Completo</label>
              <div style={styles.inputBox}>
                <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <input style={styles.input} type="text" name="nome" placeholder="O teu nome" value={formData.nome} onChange={handleInputChange} required />
              </div>
            </div>
          )}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Endereço de Email</label>
            <div style={styles.inputBox}>
              <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <input style={styles.input} type="email" name="email" placeholder="exemplo@email.com" value={formData.email} onChange={handleInputChange} required />
            </div>
          </div>
          <div style={styles.inputWrapper} styles={{marginBottom: view === 'login' ? '5px' : '12px'}}>
            <label style={styles.label}>Palavra-Passe</label>
            <div style={styles.inputBox}>
              <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input style={styles.input} type="password" name="password" placeholder="........" value={formData.password} onChange={handleInputChange} required />
            </div>
          </div>
          
          {view === 'login' && (<span style={{display: 'block', textAlign: 'right', color: theme.primary, fontSize: '11px', textDecoration: 'none', marginTop: '5px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer'}} onClick={() => setView('forgot')}>Esqueceste-te da senha?</span>)}

          {view === 'register' && (
            <>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Confirmar Palavra-Passe</label>
                <div style={styles.inputBox}>
                  <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input style={styles.input} type="password" name="confirmarPassword" placeholder="........" value={formData.confirmarPassword} onChange={handleInputChange} required />
                </div>
              </div>
              <label style={styles.label}>Tipo de Conta</label>
              <div style={{display: 'flex', gap: '20px', marginTop: '5px'}}>
                <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain}}><input type="radio" name="tipo" value="aluno" checked={formData.tipo === 'aluno'} onChange={handleInputChange} /> Aluno</label>
                <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain}}><input type="radio" name="tipo" value="professor" checked={formData.tipo === 'professor'} onChange={handleInputChange} /> Professor</label>
              </div>
            </>
          )}
          <button type="submit" style={styles.submitButton}>{view === 'login' ? 'Entrar na Plataforma' : 'Criar Conta'}</button>
        </form>
      </div>

      <div style={styles.footerText}>
        {view === 'login' ? "Ainda não tens conta? " : "Já tens uma conta? "}
        <span style={styles.footerLink} onClick={() => setView(view === 'login' ? 'register' : 'login')}>{view === 'login' ? "Regista-te aqui" : "Entra aqui"}</span>
      </div>
    </div>
  );
}

export default App;
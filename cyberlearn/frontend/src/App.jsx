import { useState, useEffect, useMemo } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Cursos from './components/Cursos';
import Licao from './components/Licao';
import Profile from './components/Profile';
import Quizzes from './components/Quizzes';
import ProfessorDashboard from './components/ProfessorDashboard';
import ProfessorAlunos from './components/ProfessorAlunos';
import ProfessorCursos from './components/ProfessorCursos';
import AdminDashboard from './components/AdminDashboard';
import AdminProfessores from './components/AdminProfessores';
import AdminAprovacoes from './components/AdminAprovacoes';
import { apiFetch } from './api';
import { useUI } from './components/ui/UIProvider';

// ─── Utilitário: comprime uma imagem base64 antes de enviar ao servidor ────────
const compressImage = (base64, maxWidth = 300, quality = 0.75) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale  = Math.min(1, maxWidth / img.width);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64); 
    img.src = base64;
  });
// ────────────────────────────────────────────────────────────────────────────────

function App() {
  const { notify } = useUI();
  const [user, setUser] = useState(() => {
    try { const saved = localStorage.getItem('cyberlearn_user'); return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [view, setView] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberlearn_user');
      if (!saved) return 'login';
      const u = JSON.parse(saved);
      if (u.tipo === 'admin') return 'admin_dashboard';
      if (u.tipo === 'professor') return 'professor_dashboard';
      return 'dashboard';
    } catch { return 'login'; }
  });

  const [activeCourse, setActiveCourse] = useState(null);
  const [targetQuizCourse, setTargetQuizCourse] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', confirmarPassword: '', tipo: 'aluno' });
  const [tempUserId, setTempUserId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { const saved = localStorage.getItem('cyberlearn_darkMode'); return saved !== null ? JSON.parse(saved) : true; } catch { return true; }
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);

  const [profileData, setProfileData] = useState({
    nome: '', senhaAtual: '', novaSenha: '', confirmarNovaSenha: '', biografiaProf: '', metodologia: '', nivelExperiencia: 'iniciante', interesse: '', biografia: '', conquistas: '', github: '', linkedin: ''
  });

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [avatarImg, setAvatarImg] = useState(user?.avatar || null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 850);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        nome: user.nome || '', biografiaProf: user.biografiaProf || '', metodologia: user.metodologia || '', nivelExperiencia: user.nivelExperiencia || 'iniciante', interesse: user.interesse || '', biografia: user.biografia || '', conquistas: user.conquistas || '', github: user.github || '', linkedin: user.linkedin || ''
      }));
    }
  }, [user]);

  useEffect(() => { document.body.style.backgroundColor = isDarkMode ? '#070b14' : '#f8fafc'; document.body.style.transition = 'background-color 0.3s ease'; try { localStorage.setItem('cyberlearn_darkMode', JSON.stringify(isDarkMode)); } catch {} }, [isDarkMode]);

  useEffect(() => { try { if (user) { localStorage.setItem('cyberlearn_user', JSON.stringify(user)); } else { localStorage.removeItem('cyberlearn_user'); } } catch {} }, [user]);

  const handleInputChange   = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handleLogout = () => { setUser(null); setView('login'); setFormData({ ...formData, password: '' }); setTempUserId(null); setShow2FA(false); setAvatarImg(null); setActiveCourse(null); setTargetQuizCourse(null); try { localStorage.removeItem('cyberlearn_user'); localStorage.removeItem('cyberlearn_token'); } catch {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (view === 'login' && show2FA) {
      const formDataObj = new FormData(e.currentTarget);
      const tokenFinal = formDataObj.get('codigo2FA');
      if (!tokenFinal || tokenFinal.length !== 6) return notify("Preenche todos os 6 dígitos enviados para o teu email.", 'warning');
      try {
        const response = await apiFetch('/login-2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ utilizadorId: tempUserId, token: tokenFinal }) });
        const data = await response.json();
        if (response.ok) {
          const userData = { ...data.utilizador, streakCount: data.utilizador.streakCount || 0 };
          setUser(userData);
          try {
            localStorage.setItem('cyberlearn_user', JSON.stringify(userData));
            if (data.token) localStorage.setItem('cyberlearn_token', data.token);
          } catch {}
          setAvatarImg(data.utilizador.avatar || null);
          setShow2FA(false);
          setFormData({ ...formData, password: '' });
          if (data.utilizador.tipo === 'admin') setView('admin_dashboard');
          else if (data.utilizador.tipo === 'professor') setView('professor_dashboard');
          else setView('dashboard');
        } else { notify(data.erro || 'Não foi possível validar o código.', 'error'); }
      } catch (error) { notify("Erro de ligação com o servidor.", 'error'); }
      return;
    }

    if (view === 'reset') {
      if (formData.password !== formData.confirmarPassword) return notify("As palavras-passe não coincidem!", 'warning');
      const formDataObj = new FormData(e.currentTarget);
      const codigoReset = formDataObj.get('codigoReset');
      if (!codigoReset || codigoReset.length !== 6) return notify("Insere o código de 6 dígitos que recebeste no email.", 'warning');
      try {
        const response = await apiFetch('/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, token: codigoReset, novaPassword: formData.password }) });
        const data = await response.json();
        if (response.ok) { notify(data.mensagem || 'Palavra-passe atualizada!', 'success'); setView('login'); setFormData({ ...formData, password: '', confirmarPassword: '' }); }
        else { notify(data.erro || 'Não foi possível repor a palavra-passe.', 'error'); }
      } catch (error) { notify("Erro de ligação.", 'error'); }
      return;
    }

    if (view === 'forgot') {
      try {
        const response = await apiFetch('/recuperar-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
        const data = await response.json();
        if (response.ok) { setView('reset'); } else { notify(data.erro || 'Não foi possível enviar o código.', 'error'); }
      } catch (error) { notify("Erro de ligação.", 'error'); }
      return;
    }

    if (view === 'register' && formData.password !== formData.confirmarPassword) return notify("As palavras-passe não coincidem!", 'warning');

    const endpoint = view === 'login' ? '/login' : '/registar';
    try {
      const response = await apiFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (response.ok) {
        if (view === 'register') { notify('Conta criada com sucesso!', 'success'); setView('login'); setFormData({ ...formData, password: '', confirmarPassword: '' }); }
        else if (view === 'login') {
          if (data.requires2FA) {
            setTempUserId(data.utilizadorId);
            setShow2FA(true);
          } else {
            const userData = { ...data.utilizador, streakCount: data.utilizador.streakCount || 0 };
            setUser(userData);
            try { if (data.token) localStorage.setItem('cyberlearn_token', data.token); } catch {}
            setAvatarImg(data.utilizador.avatar || null);
            setFormData({ ...formData, password: '' });
            if (data.utilizador.tipo === 'admin') setView('admin_dashboard');
            else if (data.utilizador.tipo === 'professor') setView('professor_dashboard');
            else setView('dashboard');
          }
        }
      } else { notify(data.erro || 'Ocorreu um erro.', 'error'); }
    } catch (error) { notify("Erro de ligação ao servidor.", 'error'); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileData.novaSenha && profileData.novaSenha !== profileData.confirmarNovaSenha)
      return notify("As novas palavras-passe não coincidem!", 'warning');

    try {
      let avatarParaEnviar = undefined;
      if (avatarImg?.startsWith('data:')) {
        avatarParaEnviar = await compressImage(avatarImg);
        if (user?.id) localStorage.setItem(`cyberlearn_avatar_${user.id}`, avatarParaEnviar);
      }

      const response = await apiFetch('/atualizar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          nome: profileData.nome,
          senhaAtual: profileData.senhaAtual,
          novaSenha: profileData.novaSenha,
          avatar: avatarParaEnviar !== undefined ? avatarParaEnviar : (avatarImg || null),
          biografiaProf: profileData.biografiaProf || '',
          metodologia: profileData.metodologia || '',
          nivelExperiencia: profileData.nivelExperiencia || 'iniciante',
          interesse: profileData.interesse || '',
          biografia: profileData.biografia || '',
          conquistas: profileData.conquistas || '',
          github: profileData.github || '',
          linkedin: profileData.linkedin || '',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        notify("Alterações guardadas com sucesso!", 'success');
        setUser({
          ...user,
          nome: profileData.nome,
          // Corrigido: Garante que se avatarImg for null, o avatar na aplicação fica null
          avatar: avatarParaEnviar !== undefined ? avatarParaEnviar : avatarImg,
          biografiaProf: profileData.biografiaProf,
          metodologia: profileData.metodologia,
          nivelExperiencia: profileData.nivelExperiencia,
          interesse: profileData.interesse,
          biografia: profileData.biografia,
          conquistas: profileData.conquistas,
          github: profileData.github,
          linkedin: profileData.linkedin,
        });
        setProfileData({ ...profileData, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
      } else {
        notify(data.erro || 'Não foi possível guardar o perfil.', 'error');
      }
    } catch (error) {
      console.error('Erro ao guardar perfil:', error);
      notify("Erro de ligação ao servidor.", 'error');
    }
  };

  const theme = useMemo(() => ({
    bg:          isDarkMode ? '#070b14' : '#f8fafc',
    cardBg:      isDarkMode ? '#0f172a' : '#ffffff',
    sidebarBg:   isDarkMode ? '#0b1120' : '#ffffff',
    textMain:    isDarkMode ? '#e2e8f0' : '#0f172a',
    textSub:     isDarkMode ? '#94a3b8' : '#64748b',
    inputBg:     isDarkMode ? '#16213a' : '#f8fafc',
    inputBorder: isDarkMode ? '#243044' : '#e2e8f0',
    inputText:   isDarkMode ? '#e2e8f0' : '#0f172a',
    shadow:      isDarkMode ? '0 10px 30px -12px rgba(0,0,0,0.65)' : '0 4px 16px -4px rgba(15,23,42,0.10)',
    iconBg:      isDarkMode ? '#16213a' : '#f1f5f9',
    iconColor:   isDarkMode ? '#facc15' : '#475569',
    primary:     '#3b82f6',
    accent:      '#22d3ee',
    gradient:    'linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%)',
    danger:      '#ef4444',
    warning:     '#f59e0b',
    success:     '#10b981',
    textUniversal: '#2563eb',
  }), [isDarkMode]);

  if (['login', 'register', 'forgot', 'reset'].includes(view)) {
    return <Auth view={view} setView={setView} formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} show2FA={show2FA} setShow2FA={setShow2FA} />;
  }

  if (['dashboard', 'professor_dashboard', 'professor_alunos', 'professor_cursos', 'admin_dashboard', 'admin_professores', 'admin_aprovacoes', 'profile', 'cursos', 'licao', 'quizzes'].includes(view)) {
    return (
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', width: '100%', backgroundColor: 'transparent', overflow: 'hidden' }}>

        <Sidebar view={view} setView={setView} handleLogout={handleLogout} theme={theme} user={user} isMobile={isMobile} />

        <div style={{ flex: 1, padding: isMobile ? '15px' : '20px 30px', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden', height: isMobile ? 'calc(100vh - 65px)' : '100vh' }}>

          {view !== 'licao' && (
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '20px', gap: isMobile ? '15px' : '0' }}>
              <div style={{ width: '100%' }}>
                <h1 style={{ fontSize: isMobile ? '18px' : '20px', color: theme.textMain, margin: 0, fontWeight: 'bold' }}>
                  {view === 'dashboard'          ? `Olá, ${user?.nome.split(' ')[0]} ` :
                   view === 'professor_dashboard' ? `Olá, ${user?.nome.split(' ')[0]} ` :
                   view === 'professor_alunos'    ? `Gestão de Alunos ` :
                   view === 'professor_cursos'    ? `Contéudos Educativos ` :
                   view === 'admin_dashboard'     ? `Olá, ${user?.nome.split(' ')[0]} ` :
                   view === 'admin_professores'   ? `Gestão de Professores ` :
                   view === 'admin_aprovacoes'    ? `Aprovações de Conteúdos ` :
                   view === 'cursos'              ? 'Catálogo de Cursos ' :
                   view === 'quizzes'             ? 'Quizzes' : 'O Teu Perfil '}
                </h1>
                <p style={{ color: theme.textSub, margin: '2px 0 0 0', fontSize: '12px' }}>
                  {view === 'dashboard'          ? 'Bem-vindo ao teu centro de estudo.' :
                   view === 'professor_dashboard' ? 'Aqui está a atividade dos alunos.' :
                   view === 'professor_alunos'    ? 'Acompanha o progresso e as notas dos teus alunos.' :
                   view === 'professor_cursos'    ? 'Cria, edita e apaga conteúdos educativos.' :
                   view === 'admin_dashboard'     ? 'Aqui está a atividade dos professores.' :
                   view === 'admin_professores'   ? 'Consulta perfis e remove professores do sistema.' :
                   view === 'admin_aprovacoes'    ? 'Aprova ou rejeita os cursos e quizzes pendentes.' :
                   view === 'cursos'              ? 'Explora os novos módulos.' :
                   view === 'quizzes'             ? 'Testa os teus conhecimentos.' : 'Gere a tua conta e segurança.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                <div style={{ backgroundColor: theme.iconBg, width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', color: theme.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} onClick={() => setIsDarkMode(!isDarkMode)} title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}>
                  {isDarkMode
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
                </div>

                <div
                  onClick={() => setView('profile')}
                  title="Aceder ao Perfil"
                  style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: `0 4px 10px ${theme.primary}50`, transition: 'transform 0.2s ease', overflow: 'hidden' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {avatarImg
                    ? <img src={avatarImg} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user?.nome?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {view === 'dashboard'          && <Dashboard theme={theme} user={user} setView={setView} />}
          {view === 'cursos'             && <Cursos setView={setView} theme={theme} setActiveCourse={setActiveCourse} />}
          {view === 'licao'              && <Licao setView={setView} theme={theme} curso={activeCourse} user={user} setTargetQuizCourse={setTargetQuizCourse} />}
          {view === 'quizzes'            && <Quizzes theme={theme} setView={setView} user={user} targetQuizCourse={targetQuizCourse} setTargetQuizCourse={setTargetQuizCourse} />}
          {view === 'professor_dashboard'&& <ProfessorDashboard theme={theme} user={user} />}
          {view === 'professor_alunos'   && <ProfessorAlunos theme={theme} />}
          {view === 'professor_cursos'   && <ProfessorCursos theme={theme} user={user} />}
          {view === 'admin_dashboard'    && <AdminDashboard theme={theme} user={user} setView={setView} />}
          {view === 'admin_professores'  && <AdminProfessores theme={theme} />}
          {view === 'admin_aprovacoes'   && <AdminAprovacoes theme={theme} />}
          {view === 'profile'            && <Profile user={user} profileData={profileData} handleProfileChange={handleProfileChange} handleSaveProfile={handleSaveProfile} is2FAEnabled={is2FAEnabled} setIs2FAEnabled={setIs2FAEnabled} theme={theme} avatarImg={avatarImg} setAvatarImg={setAvatarImg} />}
        </div>
      </div>
    );
  }
  return null;
}

export default App;
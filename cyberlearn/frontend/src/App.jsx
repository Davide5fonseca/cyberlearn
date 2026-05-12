import { useState, useEffect } from 'react';
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

// ─── Utilitário: comprime uma imagem base64 antes de enviar ao servidor ────────
// Reduz tipicamente de vários MB para ~20-50KB, evitando erros 413 Payload Too Large
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
    img.onerror = () => resolve(base64); // se falhar, usa o original
    img.src = base64;
  });
// ────────────────────────────────────────────────────────────────────────────────

function App() {
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
  const [avatarImg, setAvatarImg] = useState(null);

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

  useEffect(() => { document.body.style.backgroundColor = isDarkMode ? '#060b14' : '#f0f2f5'; document.body.style.transition = 'background-color 0.3s ease'; try { localStorage.setItem('cyberlearn_darkMode', JSON.stringify(isDarkMode)); } catch {} }, [isDarkMode]);

  useEffect(() => { try { if (user) { localStorage.setItem('cyberlearn_user', JSON.stringify(user)); } else { localStorage.removeItem('cyberlearn_user'); } } catch {} }, [user]);

  const handleInputChange   = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handleLogout = () => { setUser(null); setView('login'); setFormData({ ...formData, password: '' }); setTempUserId(null); setShow2FA(false); setAvatarImg(null); setActiveCourse(null); try { localStorage.removeItem('cyberlearn_user'); } catch {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (view === 'login' && show2FA) {
      const formDataObj = new FormData(e.currentTarget);
      const tokenFinal = formDataObj.get('codigo2FA');
      if (!tokenFinal || tokenFinal.length !== 6) return alert("Por favor, preenche todos os 6 dígitos enviados para o teu email.");
      try {
        const response = await apiFetch('/login-2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ utilizadorId: tempUserId, token: tokenFinal }) });
        const data = await response.json();
        if (response.ok) {
          const userData = { ...data.utilizador, streakCount: data.utilizador.streakCount || 0 };
          setUser(userData);
          try { localStorage.setItem('cyberlearn_user', JSON.stringify(userData)); } catch {}
          setAvatarImg(data.utilizador.avatar || null);
          setShow2FA(false);
          setFormData({ ...formData, password: '' });
          if (data.utilizador.tipo === 'admin') setView('admin_dashboard');
          else if (data.utilizador.tipo === 'professor') setView('professor_dashboard');
          else setView('dashboard');
        } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação com o servidor."); }
      return;
    }

    if (view === 'reset') {
      if (formData.password !== formData.confirmarPassword) return alert("As palavras-passe não coincidem!");
      const formDataObj = new FormData(e.currentTarget);
      const codigoReset = formDataObj.get('codigoReset');
      if (!codigoReset || codigoReset.length !== 6) return alert("Por favor, insere o código de 6 dígitos que recebeste no email.");
      try {
        const response = await apiFetch('/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, token: codigoReset, novaPassword: formData.password }) });
        const data = await response.json();
        if (response.ok) { alert("Sucesso! " + data.mensagem); setView('login'); setFormData({ ...formData, password: '', confirmarPassword: '' }); }
        else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }

    if (view === 'forgot') {
      try {
        const response = await apiFetch('/recuperar-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
        const data = await response.json();
        if (response.ok) { setView('reset'); } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }

    if (view === 'register' && formData.password !== formData.confirmarPassword) return alert("As palavras-passe não coincidem!");

    const endpoint = view === 'login' ? '/login' : '/registar';
    try {
      const response = await apiFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (response.ok) {
        if (view === 'register') { alert('Conta criada com sucesso!'); setView('login'); setFormData({ ...formData, password: '', confirmarPassword: '' }); }
        else if (view === 'login') {
          if (data.requires2FA) {
            setTempUserId(data.utilizadorId);
            setShow2FA(true);
          } else {
            const userData = { ...data.utilizador, streakCount: data.utilizador.streakCount || 0 };
            setUser(userData);
            setAvatarImg(data.utilizador.avatar || null);
            setFormData({ ...formData, password: '' });
            if (data.utilizador.tipo === 'admin') setView('admin_dashboard');
            else if (data.utilizador.tipo === 'professor') setView('professor_dashboard');
            else setView('dashboard');
          }
        }
      } else { alert(`Erro: ${data.erro}`); }
    } catch (error) { alert("Erro de ligação ao servidor."); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileData.novaSenha && profileData.novaSenha !== profileData.confirmarNovaSenha)
      return alert("As novas palavras-passe não coincidem!");

    try {
      // ── CORREÇÃO: só envia o avatar quando é uma nova imagem local (base64).
      // Se for uma URL do servidor (http...) ou null, não a inclui no body,
      // evitando payloads de vários MB que causam erro 413 / queda da ligação.
      let avatarParaEnviar = undefined;
      if (avatarImg?.startsWith('data:')) {
        // Comprime para ~300px / JPEG 75% antes de enviar (~20-50KB em vez de vários MB)
        avatarParaEnviar = await compressImage(avatarImg);
        // Atualiza o localStorage com a versão comprimida para consistência
        if (user?.id) {
          localStorage.setItem(`cyberlearn_avatar_${user.id}`, avatarParaEnviar);
          setAvatarImg(avatarParaEnviar);
        }
      }

      const response = await apiFetch('/atualizar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          nome: profileData.nome,
          senhaAtual: profileData.senhaAtual,
          novaSenha: profileData.novaSenha,
          // Inclui avatar apenas se for uma nova imagem comprimida
          ...(avatarParaEnviar !== undefined && { avatar: avatarParaEnviar }),
          biografiaProf: profileData.biografiaProf,
          metodologia: profileData.metodologia,
          nivelExperiencia: profileData.nivelExperiencia,
          interesse: profileData.interesse,
          biografia: profileData.biografia,
          conquistas: profileData.conquistas,
          github: profileData.github,
          linkedin: profileData.linkedin,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Alterações guardadas com sucesso!");
        setUser({
          ...user,
          nome: profileData.nome,
          // Se o servidor devolver a URL final da imagem, usa-a; senão mantém o estado atual
          avatar: data.utilizador?.avatar ?? (avatarParaEnviar ?? user.avatar),
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
      } else { alert(`Erro: ${data.erro}`); }
    } catch (error) {
      console.error('Erro ao guardar perfil:', error);
      alert("Erro de ligação ao servidor.");
    }
  };

  const theme = { bg: isDarkMode ? '#060b14' : '#f0f2f5', cardBg: isDarkMode ? '#171f2f' : '#ffffff', sidebarBg: isDarkMode ? '#111827' : '#ffffff', textMain: isDarkMode ? '#ffffff' : '#111827', textSub: isDarkMode ? '#9ca3af' : '#6b7280', inputBg: isDarkMode ? '#1f2937' : '#f9fafb', inputBorder: isDarkMode ? '#374151' : '#d1d5db', inputText: isDarkMode ? '#ffffff' : '#111827', shadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 4px 10px rgba(0,0,0,0.05)', iconBg: isDarkMode ? '#1f2937' : '#f3f4f6', iconColor: isDarkMode ? '#facc15' : '#4b5563', primary: '#3b82f6', danger: '#ef4444', warning: '#f59e0b', textUniversal: '#3b82f6', success: '#10b981' };

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
                   view === 'professor_alunos'    ? `Gestão de Turmas ` :
                   view === 'professor_cursos'    ? `O Teu Cofre de Cursos ` :
                   view === 'admin_dashboard'     ? `Olá, ${user?.nome.split(' ')[0]} ` :
                   view === 'admin_professores'   ? `Gestão de Professores ` :
                   view === 'admin_aprovacoes'    ? `Aprovações de Conteúdos ` :
                   view === 'cursos'              ? 'Catálogo de Cursos ' :
                   view === 'quizzes'             ? 'Quizzes' : 'O Teu Perfil '}
                </h1>
                <p style={{ color: theme.textSub, margin: '2px 0 0 0', fontSize: '12px' }}>
                  {view === 'dashboard'          ? 'Bem-vindo ao teu centro de treino.' :
                   view === 'professor_dashboard' ? 'Aqui está a atividade dos alunos.' :
                   view === 'professor_alunos'    ? 'Acompanha o progresso e as notas da tua turma.' :
                   view === 'professor_cursos'    ? 'Cria, gere e apaga conteúdos educativos.' :
                   view === 'admin_dashboard'     ? 'Aqui está a atividade dos professores.' :
                   view === 'admin_professores'   ? 'Consulta perfis e remove professores do sistema.' :
                   view === 'admin_aprovacoes'    ? 'Aprova ou rejeita os cursos e quizzes pendentes.' :
                   view === 'cursos'              ? 'Explora e inscreve-te em novos módulos.' :
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
          {view === 'licao'              && <Licao setView={setView} theme={theme} curso={activeCourse} user={user} />}
          {view === 'quizzes'            && <Quizzes theme={theme} setView={setView} user={user} />}
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
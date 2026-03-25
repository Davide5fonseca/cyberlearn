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

function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', confirmarPassword: '', tipo: 'aluno' });
  const [tempUserId, setTempUserId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [profileData, setProfileData] = useState({ nome: '', senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  
  // ESTADO QUE CONTROLA SE MOSTRA O LOGIN NORMAL OU OS QUADRADOS DO 2FA
  const [show2FA, setShow2FA] = useState(false);

  useEffect(() => { if (user) setProfileData(prev => ({ ...prev, nome: user.nome })); }, [user]);
  useEffect(() => { document.body.style.backgroundColor = isDarkMode ? '#060b14' : '#f0f2f5'; document.body.style.transition = 'background-color 0.3s ease'; }, [isDarkMode]);
  
  // NOTA: O useEffect que lia o "token" do link no URL foi removido, pois agora usamos o código de 6 dígitos!

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  
  const handleLogout = () => { setUser(null); setView('login'); setFormData({ ...formData, password: '' }); setTempUserId(null); setShow2FA(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ============================================
    // 1. SE ESTIVER A INSERIR O CÓDIGO 2FA
    // ============================================
    if (view === 'login' && show2FA) {
      const formDataObj = new FormData(e.currentTarget);
      const tokenFinal = formDataObj.get('codigo2FA');

      if (!tokenFinal || tokenFinal.length !== 6) {
          alert("Por favor, preenche todos os 6 dígitos enviados para o teu email.");
          return;
      }

      try {
        const response = await fetch('http://localhost:8080/login-2fa', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ utilizadorId: tempUserId, token: tokenFinal }) 
        });
        const data = await response.json();
        
        if (response.ok) {
          setUser(data.utilizador);
          setShow2FA(false); // Limpa o 2FA para o próximo login
          setFormData({ ...formData, password: '' }); // Limpa a password por segurança
          if (data.utilizador.tipo === 'admin') setView('admin_dashboard');
          else if (data.utilizador.tipo === 'professor') setView('professor_dashboard');
          else setView('dashboard');
        } else { 
          alert(`Erro: ${data.erro}`); 
        }
      } catch (error) { alert("Erro de ligação com o servidor."); }
      return;
    }

    // ============================================
    // 2. RECUPERAR SENHA (INSERIR CÓDIGO E NOVA SENHA)
    // ============================================
    if (view === 'reset') {
      if (formData.password !== formData.confirmarPassword) { alert("As palavras-passe não coincidem!"); return; }
      
      const formDataObj = new FormData(e.currentTarget);
      const codigoReset = formDataObj.get('codigoReset');

      if (!codigoReset || codigoReset.length !== 6) return alert("Por favor, insere o código de 6 dígitos que recebeste no email.");

      try {
        const response = await fetch('http://localhost:8080/reset-password', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ email: formData.email, token: codigoReset, novaPassword: formData.password }) 
        });
        const data = await response.json();
        if (response.ok) { 
          alert("Sucesso! " + data.mensagem); 
          setView('login'); 
          setFormData({ ...formData, password: '', confirmarPassword: '' });
        } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }
    
    // ============================================
    // 3. PEDIR CÓDIGO PARA RECUPERAR SENHA
    // ============================================
    if (view === 'forgot') {
      try {
        const response = await fetch('http://localhost:8080/recuperar-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
        const data = await response.json();
        if (response.ok) { 
          // MUDA IMEDIATAMENTE PARA O ECRÃ DE INSERIR O CÓDIGO (Sem sair da página!)
          setView('reset'); 
        } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }
    
    // ============================================
    // 4. REGISTO E LOGIN NORMAL
    // ============================================
    if (view === 'register' && formData.password !== formData.confirmarPassword) { alert("As palavras-passe não coincidem!"); return; }
    
    const endpoint = view === 'login' ? 'http://localhost:8080/login' : 'http://localhost:8080/registar';
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      
      if (response.ok) {
        if (view === 'register') { 
            alert('Conta criada com sucesso!'); 
            setView('login'); 
            setFormData({ ...formData, password: '', confirmarPassword: '' }); 
        } 
        else if (view === 'login') { 
            if (data.requires2FA) {
                setTempUserId(data.utilizadorId);
                setShow2FA(true); // Isto vai forçar o ecrã a mudar para os quadradinhos!
            }
        }
      } else { alert(`Erro: ${data.erro}`); }
    } catch (error) { alert("Erro de ligação ao servidor."); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileData.novaSenha && profileData.novaSenha !== profileData.confirmarNovaSenha) { alert("As novas palavras-passe não coincidem!"); return; }
    try {
      const response = await fetch('http://localhost:8080/atualizar-perfil', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, nome: profileData.nome, senhaAtual: profileData.senhaAtual, novaSenha: profileData.novaSenha }) });
      const data = await response.json();
      if (response.ok) { alert("Alterações guardadas com sucesso!"); setUser({ ...user, nome: profileData.nome }); setProfileData({ ...profileData, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' }); } else { alert(`Erro: ${data.erro}`); }
    } catch (error) { alert("Erro de ligação ao servidor."); }
  };

  const theme = {
    bg: isDarkMode ? '#060b14' : '#f0f2f5', cardBg: isDarkMode ? '#171f2f' : '#ffffff', sidebarBg: isDarkMode ? '#111827' : '#ffffff', textMain: isDarkMode ? '#ffffff' : '#111827', textSub: isDarkMode ? '#9ca3af' : '#6b7280', inputBg: isDarkMode ? '#1f2937' : '#f9fafb', inputBorder: isDarkMode ? '#374151' : '#d1d5db', inputText: isDarkMode ? '#ffffff' : '#111827', shadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 4px 10px rgba(0,0,0,0.05)', iconBg: isDarkMode ? '#1f2937' : '#f3f4f6', iconColor: isDarkMode ? '#facc15' : '#4b5563', primary: '#3b82f6', danger: '#ef4444', warning: '#f59e0b', textUniversal: '#3b82f6', success: '#10b981'
  };

  if (['login', 'register', 'forgot', 'reset'].includes(view)) {
    return <Auth view={view} setView={setView} formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} show2FA={show2FA} setShow2FA={setShow2FA} />;
  }

  if (['dashboard', 'professor_dashboard', 'professor_alunos', 'professor_cursos', 'admin_dashboard', 'admin_professores', 'profile', 'cursos', 'licao', 'quizzes'].includes(view)) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'transparent', overflow: 'hidden' }}>
        <Sidebar view={view} setView={setView} handleLogout={handleLogout} theme={theme} user={user} />
        
        <div style={{ flex: 1, padding: '15px 25px', boxSizing: 'border-box', overflowY: 'auto', height: '100vh' }}>
          
          {view !== 'licao' && (
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <div>
                <h1 style={{fontSize: '20px', color: theme.textMain, margin: 0, fontWeight: 'bold'}}>
                  {view === 'dashboard' ? `Olá, ${user?.nome.split(' ')[0]} ` : 
                   view === 'professor_dashboard' ? `Painel do Professor ` : 
                   view === 'professor_alunos' ? `Gestão de Alunos 👥` :
                   view === 'professor_cursos' ? `O Teu Cofre de Cursos 🔐` :
                   view === 'admin_dashboard' ? `Painel de Administração 🛡️` : 
                   view === 'admin_professores' ? `Gestão de Professores 👨‍🏫` : 
                   view === 'cursos' ? 'Catálogo de Cursos 📚' : 
                   view === 'quizzes' ? 'Quizzes e Avaliações 🎯' : 'O Teu Perfil ⚙️'}
                </h1>
                <p style={{color: theme.textSub, margin: '2px 0 0 0', fontSize: '12px'}}>
                  {view === 'dashboard' ? 'Bem-vindo de volta ao teu centro de treino.' : 
                   view === 'professor_dashboard' ? 'Monitoriza a atividade recente da tua plataforma.' : 
                   view === 'professor_alunos' ? 'Acompanha o progresso e as notas da tua turma.' : 
                   view === 'professor_cursos' ? 'Cria, gere e apaga conteúdos educativos.' : 
                   view === 'admin_dashboard' ? 'Monitoriza a atividade dos professores.' : 
                   view === 'admin_professores' ? 'Consulta perfis e remove professores do sistema.' : 
                   view === 'cursos' ? 'Explora e inscreve-te em novos módulos.' : 
                   view === 'quizzes' ? 'Testa os teus conhecimentos.' : 'Gere a tua conta e segurança.'}
                </p>
              </div>
              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <div style={{ backgroundColor: theme.iconBg, padding: '6px', borderRadius: '6px', cursor: 'pointer', color: theme.iconColor }} onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
                </div>
                <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', boxShadow: `0 4px 8px ${theme.primary}50`}}>
                  {user?.nome?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {view === 'dashboard' && <Dashboard theme={theme} />}
          {view === 'cursos' && <Cursos setView={setView} theme={theme} />}
          {view === 'licao' && <Licao setView={setView} theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
          {view === 'quizzes' && <Quizzes theme={theme} />}
          {view === 'professor_dashboard' && <ProfessorDashboard theme={theme} user={user} />}
          {view === 'professor_alunos' && <ProfessorAlunos theme={theme} />}
          {view === 'professor_cursos' && <ProfessorCursos theme={theme} user={user} />}
          {view === 'admin_dashboard' && <AdminDashboard theme={theme} />}
          {view === 'admin_professores' && <AdminProfessores theme={theme} />}
          
          {view === 'profile' && <Profile user={user} profileData={profileData} handleProfileChange={handleProfileChange} handleSaveProfile={handleSaveProfile} is2FAEnabled={is2FAEnabled} setIs2FAEnabled={setIs2FAEnabled} theme={theme} />}
        </div>
      </div>
    );
  }
  return null;
}

export default App;
import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProfessorDashboard from './components/ProfessorDashboard'; // NOVO IMPORT!
import Cursos from './components/Cursos';
import Licao from './components/Licao';
import Profile from './components/Profile';
import Quizzes from './components/Quizzes';

function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', confirmarPassword: '', tipo: 'aluno' });
  const [resetToken, setResetToken] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [profileData, setProfileData] = useState({ nome: '', senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => { if (user) setProfileData(prev => ({ ...prev, nome: user.nome })); }, [user]);
  useEffect(() => { document.body.style.backgroundColor = isDarkMode ? '#060b14' : '#f0f2f5'; document.body.style.transition = 'background-color 0.3s ease'; }, [isDarkMode]);
  useEffect(() => { const token = new URLSearchParams(window.location.search).get('token'); if (window.location.pathname === '/reset-password' && token) { setView('reset'); setResetToken(token); } }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handleLogout = () => { setUser(null); setView('login'); setFormData({ ...formData, password: '' }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (view === 'reset') {
      if (formData.password !== formData.confirmarPassword) { alert("As palavras-passe não coincidem!"); return; }
      try {
        const response = await fetch('http://localhost:8080/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, novaPassword: formData.password }) });
        const data = await response.json();
        if (response.ok) { alert("Sucesso! " + data.mensagem); window.location.href = '/'; } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }
    if (view === 'forgot') {
      try {
        const response = await fetch('http://localhost:8080/recuperar-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
        const data = await response.json();
        if (response.ok) { alert("Se o email existir, receberás um link de recuperação."); setView('login'); } else { alert(`Erro: ${data.erro}`); }
      } catch (error) { alert("Erro de ligação."); }
      return;
    }
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
            // 1. Guardar os dados do utilizador no React
            setUser(data.utilizador); 
            
            // 2. Imprimir na consola para termos a certeza do que veio da BD
            console.log("Dados recebidos da BD:", data.utilizador);

            // 3. A MÁGICA DA DISTINÇÃO:
            if (data.utilizador.tipo === 'professor') {
                setView('professor_dashboard'); // Vai para o painel de gestão
            } else {
                setView('dashboard'); // Vai para o painel de estudo normal
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
    bg: isDarkMode ? '#060b14' : '#f0f2f5', cardBg: isDarkMode ? '#171f2f' : '#ffffff', sidebarBg: isDarkMode ? '#111827' : '#ffffff', textMain: isDarkMode ? '#ffffff' : '#111827', textSub: isDarkMode ? '#9ca3af' : '#6b7280', inputBg: isDarkMode ? '#1f2937' : '#f9fafb', inputBorder: isDarkMode ? '#374151' : '#d1d5db', inputText: isDarkMode ? '#ffffff' : '#111827', shadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.05)', iconBg: isDarkMode ? '#1f2937' : '#f3f4f6', iconColor: isDarkMode ? '#facc15' : '#4b5563', primary: '#3b82f6', danger: '#ef4444', warning: '#f59e0b', textUniversal: '#3b82f6', success: '#10b981'
  };

  if (['login', 'register', 'forgot', 'reset'].includes(view)) {
    return <Auth view={view} setView={setView} formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
  }

  // MUDANÇA: Adicionado 'professor_dashboard' às vistas permitidas
  if (['dashboard', 'professor_dashboard', 'profile', 'cursos', 'licao', 'quizzes'].includes(view)) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'transparent', overflow: 'hidden' }}>
        
        {/* Passamos o 'user' para a Sidebar saber o que mostrar */}
        <Sidebar view={view} setView={setView} handleLogout={handleLogout} theme={theme} user={user} />
        
        <div style={{ flex: 1, padding: '20px 30px', boxSizing: 'border-box', overflowY: 'auto', height: '100vh' }}>
          
          {view !== 'licao' && (
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
              <div>
                <h1 style={{fontSize: '24px', color: theme.textMain, margin: 0, fontWeight: 'bold'}}>
                  {view === 'dashboard' ? `Olá, ${user?.nome.split(' ')[0]} 👋` : 
                   view === 'professor_dashboard' ? `Painel do Professor 👨‍🏫` : 
                   view === 'cursos' ? 'Catálogo de Cursos 📚' : 
                   view === 'quizzes' ? 'Quizzes e Avaliações 🎯' : 'O Teu Perfil ⚙️'}
                </h1>
                <p style={{color: theme.textSub, margin: '4px 0 0 0', fontSize: '13px'}}>
                  {view === 'dashboard' ? 'Bem-vindo de volta ao teu centro de treino.' : 
                   view === 'professor_dashboard' ? 'Gere os teus cursos, quizzes e o progresso dos alunos.' : 
                   view === 'cursos' ? 'Explora e inscreve-te em novos módulos.' : 
                   view === 'quizzes' ? 'Testa os teus conhecimentos.' : 'Gere a tua conta e segurança.'}
                </p>
              </div>
              <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                <div style={{ backgroundColor: theme.iconBg, padding: '8px', borderRadius: '8px', cursor: 'pointer', color: theme.iconColor }} onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
                </div>
                <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', boxShadow: `0 4px 10px ${theme.primary}50`}}>
                  {user?.nome.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Injeta as views */}
          {view === 'dashboard' && <Dashboard theme={theme} />}
          {view === 'professor_dashboard' && <ProfessorDashboard theme={theme} user={user} />}
          {view === 'cursos' && <Cursos setView={setView} theme={theme} />}
          {view === 'licao' && <Licao setView={setView} theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
          {view === 'quizzes' && <Quizzes theme={theme} />}
          {view === 'profile' && <Profile user={user} profileData={profileData} handleProfileChange={handleProfileChange} handleSaveProfile={handleSaveProfile} is2FAEnabled={is2FAEnabled} setIs2FAEnabled={setIs2FAEnabled} theme={theme} />}
        
        </div>
      </div>
    );
  }

  return null;
}

export default App;
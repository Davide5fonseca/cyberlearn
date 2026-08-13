import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Auth from '../components/Auth';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUI } from '../components/ui/UIProvider';
import { VIEW_PATHS, HOME_POR_PERFIL } from '../layouts/VIEW_META';

const PATH_AUTH_VIEWS = {
  '/login': 'login',
  '/registar': 'register',
  '/recuperar': 'forgot',
  '/reset': 'reset',
};

// Página pública de autenticação: login com 2FA, registo e recuperação de senha.
// Reutiliza o componente <Auth> existente; a vista vem do URL.
export default function AuthPage() {
  const { login } = useAuth();
  const { theme, isDarkMode, setIsDarkMode } = useTheme();
  const { notify } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const view = PATH_AUTH_VIEWS[location.pathname] || 'login';
  const setView = (nome) => navigate(VIEW_PATHS[nome] || '/login');

  const [formData, setFormData] = useState({ nome: '', email: '', password: '', confirmarPassword: '', tipo: 'aluno' });
  const [tempUserId, setTempUserId] = useState(null);
  const [show2FA, setShow2FA] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const entrarNaApp = (data) => {
    const userData = { ...data.utilizador, streakCount: data.utilizador.streakCount || 0 };
    login(data.token, userData);
    navigate(HOME_POR_PERFIL[userData.tipo] || '/dashboard', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Passo 2 do login: validação do código 2FA recebido por email.
    if (view === 'login' && show2FA) {
      const formDataObj = new FormData(e.currentTarget);
      const tokenFinal = formDataObj.get('codigo2FA');
      if (!tokenFinal || tokenFinal.length !== 6) return notify('Preenche todos os 6 dígitos enviados para o teu email.', 'warning');
      setSubmitting(true);
      try {
        const response = await apiFetch('/login-2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ utilizadorId: tempUserId, token: tokenFinal }) });
        const data = await response.json();
        if (response.ok) {
          setShow2FA(false);
          setFormData({ ...formData, password: '' });
          entrarNaApp(data);
        } else { notify(data.erro || 'Não foi possível validar o código.', 'error'); }
      } catch { notify('Erro de ligação com o servidor.', 'error'); }
      finally { setSubmitting(false); }
      return;
    }

    if (view === 'reset') {
      if (formData.password !== formData.confirmarPassword) return notify('As palavras-passe não coincidem!', 'warning');
      const formDataObj = new FormData(e.currentTarget);
      const codigoReset = formDataObj.get('codigoReset');
      if (!codigoReset || codigoReset.length !== 6) return notify('Insere o código de 6 dígitos que recebeste no email.', 'warning');
      setSubmitting(true);
      try {
        const response = await apiFetch('/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, token: codigoReset, novaPassword: formData.password }) });
        const data = await response.json();
        if (response.ok) { notify(data.mensagem || 'Palavra-passe atualizada!', 'success'); setView('login'); setFormData({ ...formData, password: '', confirmarPassword: '' }); }
        else { notify(data.erro || 'Não foi possível repor a palavra-passe.', 'error'); }
      } catch { notify('Erro de ligação.', 'error'); }
      finally { setSubmitting(false); }
      return;
    }

    if (view === 'forgot') {
      setSubmitting(true);
      try {
        const response = await apiFetch('/recuperar-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email }) });
        const data = await response.json();
        if (response.ok) { setView('reset'); } else { notify(data.erro || 'Não foi possível enviar o código.', 'error'); }
      } catch { notify('Erro de ligação.', 'error'); }
      finally { setSubmitting(false); }
      return;
    }

    if (view === 'register' && formData.password !== formData.confirmarPassword) return notify('As palavras-passe não coincidem!', 'warning');

    const endpoint = view === 'login' ? '/login' : '/registar';
    setSubmitting(true);
    try {
      const response = await apiFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (response.ok) {
        if (view === 'register') {
          notify(data.mensagem || 'Conta criada com sucesso!', 'success');
          setView('login');
          setFormData({ ...formData, password: '', confirmarPassword: '' });
        } else if (data.requires2FA) {
          setTempUserId(data.utilizadorId);
          setShow2FA(true);
        } else {
          setFormData({ ...formData, password: '' });
          entrarNaApp(data);
        }
      } else { notify(data.erro || 'Ocorreu um erro.', 'error'); }
    } catch { notify('Erro de ligação ao servidor.', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <Auth
      view={view} setView={setView}
      formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit}
      theme={theme} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
      show2FA={show2FA} setShow2FA={setShow2FA}
    />
  );
}

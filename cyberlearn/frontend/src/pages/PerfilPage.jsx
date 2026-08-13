import { useEffect, useState } from 'react';
import Profile from '../components/Profile';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUI } from '../components/ui/UIProvider';

// Comprime uma imagem base64 antes de enviar ao servidor.
const compressImage = (base64, maxWidth = 300, quality = 0.75) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });

export default function PerfilPage() {
  const { user, atualizarUser } = useAuth();
  const { theme } = useTheme();
  const { notify } = useUI();

  const [avatarImg, setAvatarImg] = useState(user?.avatar || null);
  const [profileData, setProfileData] = useState({
    nome: '', senhaAtual: '', novaSenha: '', confirmarNovaSenha: '',
    biografiaProf: '', metodologia: '', nivelExperiencia: 'iniciante',
    interesse: '', biografia: '', conquistas: '', github: '', linkedin: ''
  });

  useEffect(() => {
    if (!user) return;
    setProfileData((prev) => ({
      ...prev,
      nome: user.nome || '', biografiaProf: user.biografiaProf || '', metodologia: user.metodologia || '',
      nivelExperiencia: user.nivelExperiencia || 'iniciante', interesse: user.interesse || '',
      biografia: user.biografia || '', conquistas: user.conquistas || '', github: user.github || '', linkedin: user.linkedin || ''
    }));
    setAvatarImg(user.avatar || null);
  }, [user]);

  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileData.novaSenha && profileData.novaSenha !== profileData.confirmarNovaSenha)
      return notify('As novas palavras-passe não coincidem!', 'warning');

    try {
      let avatarParaEnviar;
      if (avatarImg?.startsWith('data:')) {
        avatarParaEnviar = await compressImage(avatarImg);
      }

      // Só enviamos a password quando o utilizador quer mesmo mudá-la —
      // o servidor atualiza apenas os campos presentes no pedido.
      const body = {
        nome: profileData.nome,
        avatar: avatarParaEnviar !== undefined ? avatarParaEnviar : (avatarImg || null),
        biografiaProf: profileData.biografiaProf || '',
        metodologia: profileData.metodologia || '',
        nivelExperiencia: profileData.nivelExperiencia || 'iniciante',
        interesse: profileData.interesse || '',
        biografia: profileData.biografia || '',
        github: profileData.github || '',
        linkedin: profileData.linkedin || '',
      };
      if (profileData.novaSenha) {
        body.senhaAtual = profileData.senhaAtual;
        body.novaSenha = profileData.novaSenha;
      }

      const response = await apiFetch('/atualizar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        notify('Alterações guardadas com sucesso!', 'success');
        atualizarUser({
          nome: profileData.nome,
          avatar: avatarParaEnviar !== undefined ? avatarParaEnviar : avatarImg,
          biografiaProf: profileData.biografiaProf,
          metodologia: profileData.metodologia,
          nivelExperiencia: profileData.nivelExperiencia,
          interesse: profileData.interesse,
          biografia: profileData.biografia,
          github: profileData.github,
          linkedin: profileData.linkedin,
        });
        setProfileData({ ...profileData, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
      } else {
        notify(data.erro || 'Não foi possível guardar o perfil.', 'error');
      }
    } catch (error) {
      console.error('Erro ao guardar perfil:', error);
      notify('Erro de ligação ao servidor.', 'error');
    }
  };

  return (
    <Profile
      user={user}
      profileData={profileData}
      handleProfileChange={handleProfileChange}
      handleSaveProfile={handleSaveProfile}
      theme={theme}
      avatarImg={avatarImg}
      setAvatarImg={setAvatarImg}
    />
  );
}

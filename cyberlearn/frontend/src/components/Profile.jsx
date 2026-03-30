/* eslint-disable react/prop-types */
import { useRef } from 'react';

export default function Profile({ 
  user, profileData, handleProfileChange, handleSaveProfile, 
  is2FAEnabled, setIs2FAEnabled, theme, avatarImg, setAvatarImg, 
  isReadOnly = false, viewedUser = null 
}) {
  
  // Referência para o input de ficheiro (escondido)
  const fileInputRef = useRef(null);

  // Se for modo de leitura (Admin a ver Professor), usamos os dados do viewedUser. Caso contrário, usamos os do user logado.
  const activeUser = isReadOnly ? viewedUser : user;
  
  // A foto a mostrar no cabeçalho central: se for readOnly usa a foto da BD do professor, senão usa a que está no estado do App.jsx
  const currentAvatar = isReadOnly ? activeUser?.avatar_url : (avatarImg || activeUser?.avatar_url);

  let dataRegistoFormatada = 'Desconhecida';
  if (activeUser?.data_registo) {
    if (typeof activeUser.data_registo === 'string' && activeUser.data_registo.includes('/')) {
      dataRegistoFormatada = activeUser.data_registo;
    } else {
      dataRegistoFormatada = new Date(activeUser.data_registo).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  }
  
  // CORREÇÃO AQUI: Limpa espaços e maiúsculas para garantir que não falha!
  const userRole = activeUser?.tipo?.toLowerCase().trim() || activeUser?.perfil?.toLowerCase().trim() || '';
  const isAluno = userRole === 'aluno';
  const isProfessor = userRole === 'professor';
  const isAdmin = userRole === 'admin';

  // LÓGICA PARA LER A IMAGEM SELECIONADA (Só funciona se não for modo leitura)
  const handleImageUpload = (e) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setAvatarImg(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover a imagem atual
  const handleRemoveImage = () => {
    if (isReadOnly) return;
    setAvatarImg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const styles = {
    // ALTERADO: Container agora ocupa 100% da largura, mantendo a coerência com as outras páginas (maxWidth 1200px)
    container: { width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' },
    
    headerCard: { backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' },
    avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', boxShadow: `0 8px 20px ${theme.primary}50`, zIndex: 2, overflow: 'hidden', flexShrink: 0 },
    name: { color: theme.textMain, fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', zIndex: 2, position: 'relative' },
    email: { color: theme.textSub, fontSize: '14px', margin: '0 0 10px 0', zIndex: 2, position: 'relative' },
    roleBadge: { backgroundColor: isAdmin ? `${theme.danger}20` : isProfessor ? `${theme.warning}20` : `${theme.success}20`, color: isAdmin ? theme.danger : isProfessor ? theme.warning : theme.success, padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'inline-block', zIndex: 2, position: 'relative' },
    dateBadge: { position: 'absolute', top: '20px', right: '20px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSub, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' },
    card: { backgroundColor: theme.cardBg, padding: '24px', borderRadius: '16px', boxShadow: theme.shadow, opacity: isReadOnly ? 0.9 : 1 },
    sectionTitle: { color: theme.textMain, fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '13px', fontWeight: '600', color: theme.textMain },
    input: { padding: '12px 16px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', color: theme.inputText, fontSize: '14px', outline: 'none', transition: 'border 0.2s ease', boxSizing: 'border-box', width: '100%', cursor: isReadOnly ? 'not-allowed' : 'text' },
    textarea: { padding: '12px 16px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', color: theme.inputText, fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', cursor: isReadOnly ? 'not-allowed' : 'text' },
    select: { padding: '12px 16px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', color: theme.inputText, fontSize: '14px', outline: 'none', width: '100%', cursor: isReadOnly ? 'not-allowed' : 'pointer' },
    button: { padding: '14px 28px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 12px ${theme.primary}40`, alignSelf: 'flex-end', marginTop: '10px' },
    permBadge: { padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain },
    
    uploadZone: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px',
      border: `2px dashed ${theme.inputBorder}`,
      borderRadius: '12px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
      gap: '12px'
    }
  };

  const DropzoneFotografia = () => (
    <div style={{...styles.inputGroup, marginBottom: '20px'}}>
      <label style={styles.label}>Fotografia de Perfil</label>
      <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} ref={fileInputRef} style={{ display: 'none' }} />
      <div 
        style={styles.uploadZone}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${theme.primary}08`; e.currentTarget.style.borderColor = theme.primary; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = theme.inputBorder; }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div>
          <p style={{ margin: '0 0 4px 0', color: theme.textMain, fontWeight: 'bold', fontSize: '15px' }}>Clica para escolher uma fotografia</p>
          <p style={{ margin: 0, color: theme.textSub, fontSize: '12px' }}>Formatos suportados: JPG, PNG. Tamanho máximo: 2MB.</p>
        </div>
      </div>
      {currentAvatar && (
        <button type="button" onClick={handleRemoveImage} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: theme.danger, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', padding: '4px 0', marginTop: '4px', textDecoration: 'underline' }}>
          Remover fotografia atual
        </button>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* 1. CABEÇALHO */}
      <div style={styles.headerCard}>
        <div style={styles.dateBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Membro desde {dataRegistoFormatada}
        </div>
        <div style={styles.avatar}>
          {currentAvatar ? <img src={currentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeUser ? activeUser.nome.charAt(0).toUpperCase() : 'U')}
        </div>
        <div>
          <h2 style={styles.name}>{activeUser ? activeUser.nome : 'Utilizador'}</h2>
          <p style={styles.email}>{activeUser ? activeUser.email : 'email@exemplo.com'}</p>
          <span style={styles.roleBadge}>{activeUser ? (activeUser.perfil || activeUser.tipo) : 'Conta'}</span>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 2. DADOS PESSOAIS */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Dados Pessoais
          </h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome Completo</label>
              <input style={styles.input} type="text" name="nome" value={isReadOnly ? activeUser?.nome : profileData.nome} onChange={handleProfileChange} readOnly={isReadOnly} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Endereço de E-mail</label>
              <input style={{...styles.input, opacity: 0.6, cursor: 'not-allowed'}} type="email" value={activeUser ? activeUser.email : ''} readOnly title="O e-mail não pode ser alterado por motivos de segurança." />
            </div>
          </div>
        </div>

        {/* 3A. PERFIL DO ALUNO */}
        {isAluno && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Perfil Académico e Estudantil
            </h3>

            {/* Fotografia para Aluno */}
            {!isReadOnly && <DropzoneFotografia />}

            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nível de Experiência</label>
                <select style={styles.select} name="nivelExperiencia" value={isReadOnly ? activeUser?.nivelExperiencia : profileData.nivelExperiencia || 'iniciante'} onChange={handleProfileChange} disabled={isReadOnly}>
                  <option value="iniciante">Iniciante / Curioso</option>
                  <option value="intermedio">Intermédio (Algum Conhecimento)</option>
                  <option value="avancado">Avançado (Profissional/Estudante de IT)</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Área de Maior Interesse</label>
                <input style={styles.input} type="text" name="interesse" placeholder="Ex: Pentesting, Forense, Defesa..." value={isReadOnly ? activeUser?.interesse : profileData.interesse || ''} onChange={handleProfileChange} readOnly={isReadOnly} />
              </div>
            </div>

            <div style={{...styles.inputGroup, marginTop: '20px'}}>
              <label style={styles.label}>Biografia e Objetivos</label>
              <textarea style={styles.textarea} name="biografia" placeholder="Conta um pouco sobre a tua jornada na cibersegurança..." value={isReadOnly ? activeUser?.biografia : profileData.biografia || ''} onChange={handleProfileChange} readOnly={isReadOnly}></textarea>
            </div>

            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Link do GitHub</label>
                <input style={styles.input} type="url" name="github" placeholder="https://github.com/teu-perfil" value={isReadOnly ? activeUser?.github : profileData.github || ''} onChange={handleProfileChange} readOnly={isReadOnly} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Link do LinkedIn</label>
                <input style={styles.input} type="url" name="linkedin" placeholder="https://linkedin.com/in/teu-perfil" value={isReadOnly ? activeUser?.linkedin : profileData.linkedin || ''} onChange={handleProfileChange} readOnly={isReadOnly} />
              </div>
            </div>
          </div>
        )}

        {/* 3B. PERFIL DO PROFESSOR */}
        {isProfessor && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Apresentação do Professor
            </h3>
            {!isReadOnly && <DropzoneFotografia />}
            <div style={{...styles.inputGroup, marginBottom: '20px'}}>
              <label style={styles.label}>Biografia / Apresentação</label>
              <textarea style={styles.textarea} name="biografiaProf" placeholder="Partilha a tua jornada..." value={isReadOnly ? activeUser?.biografiaProf : profileData.biografiaProf || ''} onChange={handleProfileChange} readOnly={isReadOnly}></textarea>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Metodologia de Ensino</label>
              <textarea style={{...styles.textarea, minHeight: '80px'}} name="metodologia" placeholder="Abordagem nas aulas..." value={isReadOnly ? activeUser?.metodologia : profileData.metodologia || ''} onChange={handleProfileChange} readOnly={isReadOnly}></textarea>
            </div>
          </div>
        )}

        {/* 3C. ADMIN */}
        {isAdmin && !isReadOnly && (
          <>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Fotografia de Perfil
              </h3>
              <DropzoneFotografia />
            </div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Privilégios de Acesso
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={styles.permBadge}><span style={{color: theme.success}}>●</span> Gerir Utilizadores</span>
                <span style={styles.permBadge}><span style={{color: theme.success}}>●</span> Aprovar Cursos</span>
                <span style={styles.permBadge}><span style={{color: theme.danger}}>●</span> Eliminar Contas</span>
              </div>
            </div>
          </>
        )}

        {!isReadOnly && <button type="submit" style={styles.button}>Guardar Alterações do Perfil</button>}
      </form>
    </div>
  );
}
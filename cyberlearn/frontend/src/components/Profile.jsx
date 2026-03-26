/* eslint-disable react/prop-types */

export default function Profile({ 
  user, profileData, handleProfileChange, handleSaveProfile, 
  is2FAEnabled, setIs2FAEnabled, theme, avatarImg, setAvatarImg, 
  isReadOnly = false, viewedUser = null 
}) {
  
  // Se for modo de leitura (Admin a ver Professor), usamos os dados do viewedUser. Caso contrário, usamos os do user logado.
  const activeUser = isReadOnly ? viewedUser : user;
  
  // A foto a mostrar no cabeçalho central: se for readOnly usa a foto da BD do professor, senão usa a que está no estado do App.jsx
  const currentAvatar = isReadOnly ? activeUser?.avatar_url : (avatarImg || activeUser?.avatar_url);

  // CORREÇÃO DA DATA: Lida com datas que já vêm formatadas ou datas brutas do SQL
  let dataRegistoFormatada = 'Desconhecida';
  if (activeUser?.data_registo) {
    if (typeof activeUser.data_registo === 'string' && activeUser.data_registo.includes('/')) {
      dataRegistoFormatada = activeUser.data_registo;
    } else {
      dataRegistoFormatada = new Date(activeUser.data_registo).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  }
  
  // Variáveis para facilitar a leitura das condições do perfil a mostrar
  const isAluno = activeUser?.tipo === 'aluno';
  const isProfessor = activeUser?.tipo === 'professor';
  const isAdmin = activeUser?.tipo === 'admin';

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

  const styles = {
    container: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' },
    headerCard: { backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' },
    avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', boxShadow: `0 8px 20px ${theme.primary}50`, zIndex: 2, overflow: 'hidden' },
    name: { color: theme.textMain, fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', zIndex: 2, position: 'relative' },
    email: { color: theme.textSub, fontSize: '14px', margin: '0 0 10px 0', zIndex: 2, position: 'relative' },
    roleBadge: { backgroundColor: isAdmin ? `${theme.danger}20` : isProfessor ? `${theme.warning}20` : `${theme.success}20`, color: isAdmin ? theme.danger : isProfessor ? theme.warning : theme.success, padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'inline-block', zIndex: 2, position: 'relative' },
    dateBadge: { position: 'absolute', top: '20px', right: '20px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSub, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' },
    card: { backgroundColor: theme.cardBg, padding: '24px', borderRadius: '16px', boxShadow: theme.shadow, opacity: isReadOnly ? 0.9 : 1 },
    sectionTitle: { color: theme.textMain, fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '13px', fontWeight: '600', color: theme.textMain },
    input: { padding: '12px 16px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', color: theme.inputText, fontSize: '14px', outline: 'none', transition: 'border 0.2s ease', boxSizing: 'border-box', width: '100%', cursor: isReadOnly ? 'not-allowed' : 'text' },
    textarea: { padding: '12px 16px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', color: theme.inputText, fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', cursor: isReadOnly ? 'not-allowed' : 'text' },
    button: { padding: '14px 28px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 12px ${theme.primary}40`, alignSelf: 'flex-end', marginTop: '10px' },
    buttonOutline: { padding: '12px 20px', backgroundColor: 'transparent', color: theme.primary, border: `2px solid ${theme.primary}`, borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' },
    permBadge: { padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain },
    fileInputContainer: { display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', backgroundColor: theme.inputBg, border: `1px dashed ${theme.inputBorder}`, borderRadius: '10px' }
  };

  return (
    <div style={styles.container}>
      
      {/* 1. CABEÇALHO DO PERFIL */}
      <div style={styles.headerCard}>
        <div style={styles.dateBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Membro desde {dataRegistoFormatada}
        </div>
        
        {/* AVATAR DO CABEÇALHO */}
        <div style={styles.avatar}>
          {currentAvatar ? (
            <img src={currentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            activeUser ? activeUser.nome.charAt(0).toUpperCase() : 'U'
          )}
        </div>

        <div>
          <h2 style={styles.name}>{activeUser ? activeUser.nome : 'Utilizador'}</h2>
          <p style={styles.email}>{activeUser ? activeUser.email : 'email@exemplo.com'}</p>
          <span style={styles.roleBadge}>{activeUser ? activeUser.tipo : 'Conta'}</span>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 2. DADOS DA CONTA (COMUM A TODOS) */}
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

        {/* =========================================
            3A. SECÇÃO EXCLUSIVA PARA ALUNOS
            ========================================= */}
        {isAluno && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Perfil Público de Estudante
            </h3>
            <div style={{...styles.inputGroup, marginBottom: '20px'}}>
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

        {/* =========================================
            3B. SECÇÃO EXCLUSIVA PARA PROFESSORES
            ========================================= */}
        {isProfessor && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Apresentação do Professor
            </h3>
            
            {/* INPUT DA FOTO APENAS SE NÃO FOR MODO LEITURA */}
            {!isReadOnly && (
              <div style={{...styles.inputGroup, marginBottom: '20px'}}>
                <label style={styles.label}>Fotografia de Perfil</label>
                <div style={styles.fileInputContainer}>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} style={{ color: theme.textSub, fontSize: '13px', width: '100%', cursor: 'pointer' }} />
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: theme.textSub }}>Formatos suportados: JPG, PNG. Tamanho máximo: 2MB.</p>
                  </div>
                </div>
              </div>
            )}

            <div style={{...styles.inputGroup, marginBottom: '20px'}}>
              <label style={styles.label}>Biografia / Apresentação</label>
              <textarea 
                style={styles.textarea} 
                name="biografiaProf" 
                placeholder="Partilha a tua jornada e a tua paixão pelo ensino na área de tecnologia e segurança..." 
                value={isReadOnly ? activeUser?.biografiaProf : profileData.biografiaProf || ''} 
                onChange={handleProfileChange}
                readOnly={isReadOnly}
              ></textarea>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Metodologia de Ensino</label>
              <textarea 
                style={{...styles.textarea, minHeight: '80px'}} 
                name="metodologia" 
                placeholder="Como é a tua abordagem nas aulas? (Ex: Foco em projetos práticos, aprendizagem baseada em problemas, etc.)" 
                value={isReadOnly ? activeUser?.metodologia : profileData.metodologia || ''} 
                onChange={handleProfileChange}
                readOnly={isReadOnly}
              ></textarea>
            </div>
          </div>
        )}

        {/* =========================================
            3C. SECÇÃO EXCLUSIVA PARA ADMINS
            ========================================= */}
        {isAdmin && !isReadOnly && (
          <>
            {/* Bloco: Fotografia de Perfil do Admin */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Fotografia de Perfil
              </h3>
              <div style={styles.inputGroup}>
                <div style={styles.fileInputContainer}>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} style={{ color: theme.textSub, fontSize: '13px', width: '100%', cursor: 'pointer' }} />
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: theme.textSub }}>Formatos suportados: JPG, PNG. Tamanho máximo: 2MB.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco: Permissões */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Privilégios de Acesso
              </h3>
              <p style={{ color: theme.textSub, fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                A tua conta tem privilégios de <strong>Super Administrador</strong>. Estas são as tuas permissões ativas na plataforma:
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={styles.permBadge}><span style={{color: theme.success}}>●</span> Gerir Utilizadores</span>
                <span style={styles.permBadge}><span style={{color: theme.success}}>●</span> Aprovar Cursos</span>
                <span style={styles.permBadge}><span style={{color: theme.success}}>●</span> Acesso aos Logs de Sistema</span>
                <span style={styles.permBadge}><span style={{color: theme.danger}}>●</span> Eliminar Contas</span>
              </div>
            </div>
          </>
        )}

        {/* 4. BOTÃO GUARDAR (ESCONDIDO NO MODO DE LEITURA) */}
        {!isReadOnly && (
          <button type="submit" style={styles.button}>Guardar Alterações do Perfil</button>
        )}
      </form>
    </div>
  );
}
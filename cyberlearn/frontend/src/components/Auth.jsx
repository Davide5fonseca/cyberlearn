export default function Auth({ view, setView, formData, handleInputChange, handleSubmit, theme, isDarkMode, setIsDarkMode }) {
  const styles = {
    authContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', position: 'relative', padding: '10px 0' },
    topIcon: { position: 'absolute', top: '20px', right: '20px', backgroundColor: theme.iconBg, padding: '8px', borderRadius: '8px', cursor: 'pointer', color: theme.iconColor, transition: 'all 0.3s ease' },
    logoArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
    
    // NOVO: Estilo para a tua imagem no ecrã de Login
    logoImage: { width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover', marginBottom: '12px', boxShadow: theme.shadow },
    
    mainTitle: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 2px 0', letterSpacing: '0.5px', color: theme.textMain },
    subTitle: { fontSize: '10px', color: theme.textUniversal, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0', textAlign: 'center' },
    card: { backgroundColor: theme.cardBg, padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '380px', boxSizing: 'border-box', boxShadow: theme.shadow, transition: 'all 0.3s ease' },
    inputWrapper: { marginBottom: '12px' },
    label: { display: 'block', fontSize: '10px', color: theme.textUniversal, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' },
    inputBox: { position: 'relative', display: 'flex', alignItems: 'center' },
    iconInside: { position: 'absolute', left: '12px', color: theme.textUniversal, width: '14px', height: '14px' },
    input: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '10px 10px 10px 34px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s ease' },
    submitButton: { width: '100%', backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: `0 4px 15px ${theme.primary}60`, textTransform: 'uppercase' },
    footerText: { marginTop: '20px', fontSize: '12px', color: theme.textUniversal, display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', justifyContent: 'center' },
    footerLink: { color: theme.primary, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }
  };

  const renderThemeToggle = () => (
    <div style={styles.topIcon} onClick={() => setIsDarkMode(!isDarkMode)}>
      {isDarkMode ? 
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> : 
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      }
    </div>
  );

  if (view === '2fa-verify') {
    return (
      <div style={styles.authContainer}>
        {renderThemeToggle()}
        <div style={styles.card}>
          <div style={styles.logoArea}>
            <img src="/Gemini_Generated_Image_b082ehb082ehb082.png" alt="CyberLearn Logo" style={styles.logoImage} />
            <h1 style={styles.mainTitle}>Segurança 2FA</h1>
            <p style={{...styles.subTitle, marginTop: '8px'}}>Insere o código do Google Authenticator.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Código de 6 dígitos</label>
              <div style={styles.inputBox}>
                <svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input style={{...styles.input, letterSpacing: '3px', textAlign: 'center', fontWeight: 'bold'}} type="text" name="codigo2FA" placeholder="000000" maxLength="6" value={formData?.codigo2FA || ''} onChange={handleInputChange} required />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>Verificar Acesso</button>
          </form>
          <div style={styles.footerText}>
            <span style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}} onClick={() => setView('login')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Voltar ao Login
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'reset') {
    return (
      <div style={styles.authContainer}>
        {renderThemeToggle()}
        <div style={styles.card}>
          <div style={styles.logoArea}>
            <img src="/Gemini_Generated_Image_b082ehb082ehb082.png" alt="CyberLearn Logo" style={styles.logoImage} />
            <h1 style={styles.mainTitle}>Nova Senha</h1>
            <p style={{...styles.subTitle, marginTop: '8px'}}>Cria uma nova palavra-passe segura.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Nova Palavra-Passe</label>
              <div style={styles.inputBox}><svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><input style={styles.input} type="password" name="password" placeholder="........" value={formData.password} onChange={handleInputChange} required /></div>
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Confirmar Nova Palavra-Passe</label>
              <div style={styles.inputBox}><svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><input style={styles.input} type="password" name="confirmarPassword" placeholder="........" value={formData.confirmarPassword} onChange={handleInputChange} required /></div>
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
            <img src="/Gemini_Generated_Image_b082ehb082ehb082.png" alt="CyberLearn Logo" style={styles.logoImage} />
            <h1 style={styles.mainTitle}>Recuperar Senha</h1>
            <p style={{...styles.subTitle, marginTop: '8px'}}>Introduz o teu e-mail para receberes um link.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Endereço de E-mail</label>
              <div style={styles.inputBox}><svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg><input style={styles.input} type="email" name="email" placeholder="exemplo@email.com" value={formData.email} onChange={handleInputChange} required /></div>
            </div>
            <button type="submit" style={styles.submitButton}>Enviar Link</button>
          </form>
          <div style={styles.footerText}><span style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}} onClick={() => setView('login')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Voltar ao Login</span></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.authContainer}>
      {renderThemeToggle()}
      <div style={styles.logoArea}>
        <img src="/Gemini_Generated_Image_b082ehb082ehb082.png" alt="CyberLearn Logo" style={styles.logoImage} />
        <h1 style={styles.mainTitle}>CyberLearn</h1>
        <p style={styles.subTitle}>Plataforma de cibersegurança</p>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          {view === 'register' && (
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Nome Completo</label>
              <div style={styles.inputBox}><svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><input style={styles.input} type="text" name="nome" placeholder="O teu nome" value={formData.nome} onChange={handleInputChange} required /></div>
            </div>
          )}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Endereço de Email</label>
            <div style={styles.inputBox}><svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><input style={styles.input} type="email" name="email" placeholder="exemplo@email.com" value={formData.email} onChange={handleInputChange} required /></div>
          </div>
          <div style={styles.inputWrapper} styles={{marginBottom: view === 'login' ? '5px' : '12px'}}>
            <label style={styles.label}>Palavra-Passe</label>
            <div style={styles.inputBox}><svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><input style={styles.input} type="password" name="password" placeholder="........" value={formData.password} onChange={handleInputChange} required /></div>
          </div>
          
          {view === 'login' && (<span style={{display: 'block', textAlign: 'right', color: theme.primary, fontSize: '11px', textDecoration: 'none', marginTop: '5px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer'}} onClick={() => setView('forgot')}>Esqueceste-te da senha?</span>)}

          {view === 'register' && (
            <>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Confirmar Palavra-Passe</label>
                <div style={styles.inputBox}><svg style={styles.iconInside} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><input style={styles.input} type="password" name="confirmarPassword" placeholder="........" value={formData.confirmarPassword} onChange={handleInputChange} required /></div>
              </div>
              <label style={styles.label}>Tipo de Conta</label>
              <div style={{display: 'flex', gap: '15px', marginTop: '5px'}}>
                <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain}}><input type="radio" name="tipo" value="aluno" checked={formData.tipo === 'aluno'} onChange={handleInputChange} /> Aluno</label>
                <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain}}><input type="radio" name="tipo" value="professor" checked={formData.tipo === 'professor'} onChange={handleInputChange} /> Professor</label>
                <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain}}><input type="radio" name="tipo" value="admin" checked={formData.tipo === 'admin'} onChange={handleInputChange} /> Administrador</label>
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
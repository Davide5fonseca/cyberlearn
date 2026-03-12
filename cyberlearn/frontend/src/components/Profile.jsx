export default function Profile({ user, profileData, handleProfileChange, handleSaveProfile, is2FAEnabled, setIs2FAEnabled, theme }) {
  const styles = {
    profileLayout: { display: 'flex', gap: '20px', flexWrap: 'nowrap', alignItems: 'stretch' },
    profileLeft: { flex: '1', minWidth: '220px', backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    profileRight: { flex: '2', backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow },
    avatarBig: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', fontWeight: 'bold', marginBottom: '10px', boxShadow: `0 8px 20px ${theme.primary}60` },
    badge: { backgroundColor: `${theme.success}20`, color: theme.success, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', marginTop: '5px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px' },
    divider: { width: '100%', height: '1px', backgroundColor: theme.inputBorder, margin: '15px 0' },
    inputWrapper: { marginBottom: '12px' },
    label: { display: 'block', fontSize: '10px', color: theme.textUniversal, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' },
    input: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
    submitButton: { width: '100%', backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', textTransform: 'uppercase' },
    toggleBg: { width: '40px', height: '22px', backgroundColor: is2FAEnabled ? theme.primary : theme.inputBorder, borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease' },
    toggleCircle: { width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: is2FAEnabled ? '20px' : '2px', transition: 'all 0.3s ease' }
  };

  return (
    <div style={styles.profileLayout}>
      <div style={styles.profileLeft}>
        <div style={styles.avatarBig}>{user ? user.nome.charAt(0).toUpperCase() : 'U'}</div>
        <h2 style={{color: theme.textMain, margin: '0 0 5px 0', fontSize: '20px'}}>{user ? user.nome : 'Utilizador'}</h2>
        <p style={{color: theme.textSub, margin: '0 0 10px 0', fontSize: '13px'}}>{user ? user.email : 'email@exemplo.com'}</p>
        <div style={styles.badge}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> Nível: Iniciante</div>
        <div style={styles.divider}></div>
        <div style={{width: '100%', textAlign: 'left'}}>
          <p style={{color: theme.textSub, fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px'}}>As Tuas Estatísticas</p>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}><span style={{color: theme.textMain, fontSize: '13px'}}>Desafios CTF</span><span style={{color: theme.primary, fontWeight: 'bold', fontSize: '13px'}}>4 Resolvidos</span></div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}><span style={{color: theme.textMain, fontSize: '13px'}}>Rank Global</span><span style={{color: theme.primary, fontWeight: 'bold', fontSize: '13px'}}>#1,402</span></div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}><span style={{color: theme.textMain, fontSize: '13px'}}>Conta Ativa</span><span style={{color: theme.success, fontWeight: 'bold', fontSize: '13px'}}>Sim</span></div>
        </div>
      </div>

      <div style={styles.profileRight}>
        <h3 style={{color: theme.textMain, fontSize: '16px', margin: '0 0 15px 0'}}>Detalhes da Conta</h3>
        <form onSubmit={handleSaveProfile}>
          <div style={{display: 'flex', gap: '15px'}}>
            <div style={{...styles.inputWrapper, flex: 1}}><label style={styles.label}>Nome de Exibição</label><input style={styles.input} type="text" name="nome" value={profileData.nome} onChange={handleProfileChange} required /></div>
            <div style={{...styles.inputWrapper, flex: 1}}><label style={styles.label}>Endereço de Email</label><input style={{...styles.input, opacity: 0.7}} type="email" value={user ? user.email : ''} readOnly /></div>
          </div>
          <div style={styles.divider}></div>
          <h3 style={{color: theme.textMain, fontSize: '16px', margin: '0 0 15px 0'}}>Segurança</h3>
          <div style={styles.inputWrapper}><label style={styles.label}>Palavra-Passe Atual</label><input style={styles.input} type="password" name="senhaAtual" placeholder="Necessário para alterar" value={profileData.senhaAtual} onChange={handleProfileChange} /></div>
          <div style={{display: 'flex', gap: '15px'}}>
            <div style={{...styles.inputWrapper, flex: 1}}><label style={styles.label}>Nova Palavra-Passe</label><input style={styles.input} type="password" name="novaSenha" placeholder="Nova senha" value={profileData.novaSenha} onChange={handleProfileChange} /></div>
            <div style={{...styles.inputWrapper, flex: 1}}><label style={styles.label}>Confirmar Nova Palavra-Passe</label><input style={styles.input} type="password" name="confirmarNovaSenha" placeholder="Confirmar" value={profileData.confirmarNovaSenha} onChange={handleProfileChange} /></div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px', padding: '12px', backgroundColor: theme.inputBg, borderRadius: '8px', border: `1px solid ${theme.inputBorder}`}}>
            <div><p style={{color: theme.textMain, margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '13px'}}>Autenticação de Dois Fatores (2FA)</p><p style={{color: theme.textSub, margin: 0, fontSize: '11px'}}>Aumenta a segurança com verificação móvel.</p></div>
            <div style={styles.toggleBg} onClick={() => setIs2FAEnabled(!is2FAEnabled)}><div style={styles.toggleCircle}></div></div>
          </div>
          <button type="submit" style={styles.submitButton}>Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}
import { useRef, useState } from 'react';
import { useTranslation } from '../i18n';

/* ── Força da palavra-passe ──
   Devolve a CHAVE i18n do rótulo; a tradução é feita no render. */
function getPasswordStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, labelKey: 'perfil.forcaFraca',    color: '#ff4d6d' };
  if (score <= 2) return { score: 2, labelKey: 'perfil.forcaRazoavel', color: '#ffa94d' };
  if (score <= 3) return { score: 3, labelKey: 'perfil.forcaBoa',      color: '#74c0fc' };
  return            { score: 4, labelKey: 'perfil.forcaForte',   color: '#00c896' };
}

export default function Profile({
  user, profileData, handleProfileChange, handleSaveProfile,
  theme, avatarImg, setAvatarImg,
  isReadOnly = false, viewedUser = null
}) {
  const t = useTranslation();
  const fileInputRef = useRef(null);
  const [showAtual, setShowAtual]         = useState(false);
  const [showNova, setShowNova]           = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const activeUser = isReadOnly ? viewedUser : user;

  // A foto a mostrar no cabeçalho central: se for readOnly usa a foto da BD do professor, senão usa a que está no estado do App.jsx
  const dbAvatar = activeUser?.avatar || activeUser?.avatar_url;
  const currentAvatar = isReadOnly ? dbAvatar : (avatarImg || dbAvatar);

  let dataRegistoFormatada = t('perfil.dataDesconhecida');
  if (activeUser?.data_registo) {
    if (typeof activeUser.data_registo === 'string' && activeUser.data_registo.includes('/')) {
      dataRegistoFormatada = activeUser.data_registo;
    } else {
      dataRegistoFormatada = new Date(activeUser.data_registo).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  }

  const userRole = activeUser?.tipo?.toLowerCase().trim() || activeUser?.perfil?.toLowerCase().trim() || '';
  const isAluno = userRole === 'aluno';
  const isProfessor = userRole === 'professor';
  const isAdmin = userRole === 'admin';

  // LÓGICA PARA LER A IMAGEM SELECIONADA
  const handleImageUpload = (e) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImg(reader.result);
      };
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
    container: { width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' },
    headerCard: { backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' },
    avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: theme.primary, backgroundImage: theme.gradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', boxShadow: `0 8px 20px ${theme.primary}50`, zIndex: 2, overflow: 'hidden', flexShrink: 0 },
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
    button: { padding: '14px 28px', backgroundColor: theme.primary, backgroundImage: theme.gradient, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 14px ${theme.primary}45`, alignSelf: 'flex-end', marginTop: '10px' },
    permBadge: { padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain },
    uploadOverlay: {
      position: 'absolute', inset: 0, borderRadius: '50%',
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: 0, transition: 'opacity 0.2s ease', cursor: 'pointer'
    }
  };

  // Conteúdo do avatar (imagem ou inicial) — partilhado entre o modo editável e o modo só de leitura
  const avatarContent = currentAvatar
    ? <img src={currentAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : (activeUser ? activeUser.nome.charAt(0).toUpperCase() : 'U');

  return (
    <div style={styles.container}>
      {/* 1. CABEÇALHO */}
      <div style={styles.headerCard}>
        <div style={styles.dateBadge}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          {t('perfil.membroDesde')} {dataRegistoFormatada}
        </div>

        {/* AVATAR COM UPLOAD AO CLICAR (apenas se não for modo leitura) */}
        <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} ref={fileInputRef} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
        {isReadOnly ? (
          <div style={styles.avatar}>{avatarContent}</div>
        ) : (
          <button
            type="button"
            style={{ ...styles.avatar, position: 'relative', cursor: 'pointer', border: 'none', padding: 0, fontFamily: 'inherit' }}
            onClick={() => fileInputRef.current?.click()}
            title={t('perfil.alterarFoto')}
            aria-label={t('perfil.alterarFoto')}
            onMouseEnter={(e) => { e.currentTarget.querySelector('.avatar-overlay').style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.querySelector('.avatar-overlay').style.opacity = '0'; }}
          >
            {avatarContent}
            <div className="avatar-overlay" style={styles.uploadOverlay}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          </button>
        )}

        <div>
          <h2 style={styles.name}>{activeUser ? activeUser.nome : t('perfil.utilizador')}</h2>
          <p style={styles.email}>{activeUser ? activeUser.email : 'email@exemplo.com'}</p>
          <span style={styles.roleBadge}>{activeUser ? (activeUser.perfil || activeUser.tipo) : t('perfil.conta')}</span>
          {!isReadOnly && currentAvatar && (
            <button type="button" onClick={handleRemoveImage} style={{ display: 'block', marginTop: '8px', background: 'none', border: 'none', color: theme.danger, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              {t('perfil.removerFoto')}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 2. DADOS PESSOAIS */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            {t('perfil.dadosPessoais')}
          </h3>
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="perfil-nome">{t('perfil.nomeCompleto')}</label>
              <input id="perfil-nome" style={styles.input} type="text" name="nome" value={isReadOnly ? activeUser?.nome : profileData.nome} onChange={handleProfileChange} readOnly={isReadOnly} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="perfil-email">{t('perfil.email')}</label>
              <input id="perfil-email" style={{...styles.input, opacity: 0.6, cursor: 'not-allowed'}} type="email" value={activeUser ? activeUser.email : ''} readOnly title={t('perfil.emailBloqueado')} />
            </div>
          </div>
        </div>

        {/* 3.1. PERFIL DO ALUNO */}
        {isAluno && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              {t('perfil.perfilAcademico')}
            </h3>

            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="perfil-nivel">{t('perfil.nivelExperiencia')}</label>
                <select id="perfil-nivel" style={styles.select} name="nivelExperiencia" value={isReadOnly ? activeUser?.nivelExperiencia : profileData.nivelExperiencia || 'iniciante'} onChange={handleProfileChange} disabled={isReadOnly}>
                  <option value="iniciante">{t('perfil.nivelIniciante')}</option>
                  <option value="intermedio">{t('perfil.nivelIntermedio')}</option>
                  <option value="avancado">{t('perfil.nivelAvancado')}</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="perfil-interesse">{t('perfil.areaInteresse')}</label>
                <select id="perfil-interesse" style={styles.select} name="interesse" value={isReadOnly ? activeUser?.interesse : profileData.interesse || ''} onChange={handleProfileChange} disabled={isReadOnly}>
                  <option value="">{t('perfil.selecionaArea')}</option>
                  <option value="Pentesting">{t('perfil.intPentesting')}</option>
                  <option value="Forense Digital">{t('perfil.intForense')}</option>
                  <option value="Defesa e Blue Team">{t('perfil.intBlueTeam')}</option>
                  <option value="Engenharia Social">{t('perfil.intEngSocial')}</option>
                  <option value="Segurança de Redes">{t('perfil.intRedes')}</option>
                  <option value="Desenvolvimento Seguro">{t('perfil.intDevSecOps')}</option>
                  <option value="Criptografia">{t('perfil.intCripto')}</option>
                  <option value="CTF / Competições">{t('perfil.intCtf')}</option>
                  <option value="Cloud Security">{t('perfil.intCloud')}</option>
                  <option value="Malware Analysis">{t('perfil.intMalware')}</option>
                  <option value="Outro">{t('perfil.intOutro')}</option>
                </select>
              </div>
            </div>

            <div style={{...styles.inputGroup, marginTop: '20px'}}>
              <label style={styles.label} htmlFor="perfil-biografia">{t('perfil.biografiaObjetivos')}</label>
              <textarea id="perfil-biografia" style={styles.textarea} name="biografia" placeholder={t('perfil.biografiaPlaceholder')} value={isReadOnly ? activeUser?.biografia : profileData.biografia || ''} onChange={handleProfileChange} readOnly={isReadOnly}></textarea>
            </div>
          </div>
        )}

        {/* 3.2. PERFIL DO PROFESSOR */}
        {isProfessor && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              {t('perfil.apresentacaoProf')}
            </h3>
            {!isReadOnly && (
              <div style={{ marginBottom: '20px' }}></div>
            )}
            <div style={{...styles.inputGroup, marginBottom: '20px'}}>
              <label style={styles.label} htmlFor="perfil-biografia-prof">{t('perfil.biografiaApresentacao')}</label>
              <textarea id="perfil-biografia-prof" style={styles.textarea} name="biografiaProf" placeholder={t('perfil.biografiaProfPlaceholder')} value={isReadOnly ? activeUser?.biografiaProf : profileData.biografiaProf || ''} onChange={handleProfileChange} readOnly={isReadOnly}></textarea>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="perfil-metodologia">{t('perfil.metodologia')}</label>
              <textarea id="perfil-metodologia" style={{...styles.textarea, minHeight: '80px'}} name="metodologia" placeholder={t('perfil.metodologiaPlaceholder')} value={isReadOnly ? activeUser?.metodologia : profileData.metodologia || ''} onChange={handleProfileChange} readOnly={isReadOnly}></textarea>
            </div>
          </div>
        )}

        {/* MUDAR PALAVRA-PASSE — TODOS OS PERFIS (NÃO READ-ONLY) */}
        {!isReadOnly && (() => {
          const novaSenha      = profileData.novaSenha      || '';
          const confirmarSenha = profileData.confirmarNovaSenha || '';
          const strength       = getPasswordStrength(novaSenha);
          const passwordsMatch    = novaSenha && confirmarSenha && novaSenha === confirmarSenha;
          const passwordsMismatch = novaSenha && confirmarSenha && novaSenha !== confirmarSenha;

          const eyeBtn = (show, toggle) => (
            <button
              type="button"
              onClick={toggle}
              aria-label={show ? t('perfil.ocultarSenha') : t('perfil.mostrarSenha')}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: theme.textSub, display: 'flex', alignItems: 'center', padding: 0,
              }}
            >
              {show
                ? <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          );

          return (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.warning} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {t('perfil.segurancaTitulo')}
              </h3>
              <p style={{ color: theme.textSub, fontSize: '13px', margin: '0 0 20px 0' }}>
                {t('perfil.segurancaSub')}
              </p>

              <div style={styles.grid}>
                {/* Palavra-passe Atual */}
                <div style={styles.inputGroup}>
                  <label style={styles.label} htmlFor="perfil-senha-atual">{t('perfil.senhaAtual')}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="perfil-senha-atual"
                      style={{ ...styles.input, paddingRight: '42px' }}
                      type={showAtual ? 'text' : 'password'}
                      name="senhaAtual"
                      placeholder={t('perfil.senhaAtualPlaceholder')}
                      value={profileData.senhaAtual || ''}
                      onChange={handleProfileChange}
                      autoComplete="current-password"
                    />
                    {eyeBtn(showAtual, () => setShowAtual(s => !s))}
                  </div>
                </div>

                {/* Nova Palavra-passe + barra de força */}
                <div style={styles.inputGroup}>
                  <label style={styles.label} htmlFor="perfil-nova-senha">{t('perfil.novaSenha')}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="perfil-nova-senha"
                      style={{ ...styles.input, paddingRight: '42px' }}
                      type={showNova ? 'text' : 'password'}
                      name="novaSenha"
                      placeholder={t('perfil.novaSenhaPlaceholder')}
                      value={novaSenha}
                      onChange={handleProfileChange}
                      autoComplete="new-password"
                    />
                    {eyeBtn(showNova, () => setShowNova(s => !s))}
                  </div>

                  {/* Barra de força */}
                  {strength && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{
                            flex: 1, height: '4px', borderRadius: '99px',
                            backgroundColor: i <= strength.score ? strength.color : `${theme.inputBorder}`,
                            transition: 'background-color 0.3s',
                          }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: strength.color, fontWeight: '700' }}>
                          {t(strength.labelKey)}
                        </span>
                        <span style={{ fontSize: '11px', color: theme.textSub }}>
                          {t('perfil.requisitosSenha')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar Nova Palavra-passe + indicador de match */}
                <div style={styles.inputGroup}>
                  <label style={styles.label} htmlFor="perfil-confirmar-senha">{t('perfil.confirmarSenha')}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="perfil-confirmar-senha"
                      style={{
                        ...styles.input,
                        paddingRight: '42px',
                        borderColor: passwordsMatch
                          ? '#00c896'
                          : passwordsMismatch
                          ? '#ff4d6d'
                          : theme.inputBorder,
                        transition: 'border-color 0.25s',
                      }}
                      type={showConfirmar ? 'text' : 'password'}
                      name="confirmarNovaSenha"
                      placeholder={t('perfil.confirmarSenhaPlaceholder')}
                      value={confirmarSenha}
                      onChange={handleProfileChange}
                      autoComplete="new-password"
                    />
                    {eyeBtn(showConfirmar, () => setShowConfirmar(s => !s))}
                  </div>

                  {/* Feedback de correspondência */}
                  {(passwordsMatch || passwordsMismatch) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      {passwordsMatch ? (
                        <>
                          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ fontSize: '12px', color: '#00c896', fontWeight: '600' }}>{t('perfil.senhasCoincidem')}</span>
                        </>
                      ) : (
                        <>
                          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff4d6d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          <span style={{ fontSize: '12px', color: '#ff4d6d', fontWeight: '600' }}>{t('perfil.senhasNaoCoincidem')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {!isReadOnly && <button type="submit" style={styles.button}>{t('perfil.guardar')}</button>}
      </form>
    </div>
  );
}

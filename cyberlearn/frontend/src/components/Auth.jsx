/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

// Dicionário de traduções incluído para funcionar de imediato
const translations = {
  pt: {
    'auth.welcome': 'Bem-vindo de volta',
    'auth.subtitleLogin': 'Insere as tuas credenciais para aceder à plataforma.',
    'auth.email': 'Endereço de E-mail',
    'auth.password': 'Palavra-Passe',
    'auth.passwordHint': 'Mínimo de 8 caracteres, 1 maiúscula e 1 carácter especial.',
    'auth.forgot': 'Esqueceste-te da senha?',
    'auth.signIn': 'Entrar',
    'auth.noAccount': 'Ainda não tens conta?',
    'auth.signUp': 'Regista-te aqui',
    'auth.createAccount': 'Criar Conta',
    'auth.subtitleRegister': 'Junta-te à nossa plataforma de cibersegurança.',
    'auth.fullName': 'Nome Completo',
    'auth.confirmPassword': 'Confirmar Palavra-Passe',
    'auth.role': 'Tipo de Conta',
    'auth.student': 'Aluno',
    'auth.instructor': 'Professor',
    'auth.admin': 'Administrador',
    'auth.createBtn': 'Criar Conta',
    'auth.hasAccount': 'Já tens uma conta?',
    'auth.resetTitle': 'Recuperar Senha',
    'auth.resetSub': 'Introduz o teu e-mail para receberes um código.',
    'auth.sendLink': 'Enviar Código',
    'auth.backLogin': 'Voltar ao Login',
    'auth.back': 'Voltar',
    'auth.newPassTitle': 'Nova Senha',
    'auth.newPassSub': 'Insere o código que recebeste por e-mail e a tua nova senha.',
    'auth.newPass': 'Nova Palavra-Passe',
    'auth.confirmNewPass': 'Confirmar Nova Palavra-Passe',
    'auth.resetBtn': 'Atualizar Palavra-Passe',
    'auth.twoFaTitle': 'Segurança 2FA',
    'auth.twoFaSub': 'Insere o código de 6 dígitos enviado para o teu e-mail.',
    'auth.code': 'Código de 6 dígitos',
    'auth.verifyBtn': 'Verificar Acesso',
    'auth.brandTitle': 'Domina a\nCibersegurança',
    'auth.brandSub': 'Aprende, pratica e protege. Junta-te à elite da segurança digital.'
  },
  en: {
    'auth.welcome': 'Welcome back',
    'auth.subtitleLogin': 'Enter your credentials to access the platform.',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.passwordHint': 'Minimum 8 characters, 1 uppercase, and 1 special character.',
    'auth.forgot': 'Forgot password?',
    'auth.signIn': 'Sign In',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.signUp': 'Sign up here',
    'auth.createAccount': 'Create Account',
    'auth.subtitleRegister': 'Join our cybersecurity platform.',
    'auth.fullName': 'Full Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.role': 'Account Type',
    'auth.student': 'Student',
    'auth.instructor': 'Instructor',
    'auth.admin': 'Administrator',
    'auth.createBtn': 'Create Account',
    'auth.hasAccount': 'Already have an account?',
    'auth.resetTitle': 'Recover Password',
    'auth.resetSub': 'Enter your email to receive a code.',
    'auth.sendLink': 'Send Code',
    'auth.backLogin': 'Back to Login',
    'auth.back': 'Back',
    'auth.newPassTitle': 'New Password',
    'auth.newPassSub': 'Enter the code you received via email and your new password.',
    'auth.newPass': 'New Password',
    'auth.confirmNewPass': 'Confirm New Password',
    'auth.resetBtn': 'Update Password',
    'auth.twoFaTitle': '2FA Security',
    'auth.twoFaSub': 'Enter your Google Authenticator code.',
    'auth.code': '6-Digit Code',
    'auth.verifyBtn': 'Verify Access',
    'auth.brandTitle': 'Master\nCybersecurity',
    'auth.brandSub': 'Learn, practice, and protect. Join the digital security elite.'
  }
};

export default function Auth({ view, setView, formData, handleInputChange, handleSubmit, theme, isDarkMode, setIsDarkMode, show2FA, setShow2FA }) {
  const [lang, setLang] = useState('pt');
  const t = (key) => translations[lang][key] || key;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Agora não limpamos o OTP se formos para a vista 'reset' (para poderem escrever o código lá)
    if (!show2FA && view !== 'reset') setOtp(['', '', '', '', '', '']);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [show2FA, view]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !otp[index] && event.target.previousSibling) {
      event.target.previousSibling.focus();
    }
  };

  const styles = {
    formContainer: {
      width: '100%',
      maxWidth: '380px',
      margin: '0 auto',
      padding: '0 0',
      animation: 'fadeIn 0.5s ease',
      flexShrink: 0
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: theme.textMain,
      margin: '0 0 4px 0',
      letterSpacing: '-0.02em'
    },
    subtitle: {
      fontSize: '14px',
      color: theme.textSub,
      margin: '0 0 20px 0',
      lineHeight: '1.4'
    },
    inputGroup: {
      marginBottom: '14px'
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: theme.textMain,
      marginBottom: '4px'
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: theme.inputBg,
      border: `1px solid ${theme.inputBorder}`,
      borderRadius: '8px',
      fontSize: '13px',
      color: theme.textMain,
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    passwordInput: {
      width: '100%',
      padding: '10px 40px 10px 14px', 
      backgroundColor: theme.inputBg,
      border: `1px solid ${theme.inputBorder}`,
      borderRadius: '8px',
      fontSize: '13px',
      color: theme.textMain,
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    eyeIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: theme.textSub,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    otpInput: {
      width: '45px',
      height: '55px',
      margin: '0 8px',
      textAlign: 'center',
      fontSize: '28px',
      fontWeight: '700',
      borderRadius: '10px',
      border: `2px solid ${theme.inputBorder}`,
      backgroundColor: theme.inputBg,
      color: theme.textMain,
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: theme.primary,
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '16px',
      transition: 'all 0.2s ease',
      boxShadow: `0 4px 12px ${theme.primary}40`
    },
    headerActions: {
      position: 'absolute',
      top: '16px', 
      right: '24px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      zIndex: 10
    },
    headerBtn: {
      cursor: 'pointer',
      color: theme.textSub,
      padding: '6px 10px',
      borderRadius: '8px',
      backgroundColor: theme.inputBg,
      border: `1px solid ${theme.inputBorder}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      outline: 'none'
    },
    link: {
      color: theme.primary,
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      fontSize: '13px'
    }
  };

  const renderHeaderActions = () => (
    <div style={styles.headerActions}>
      <select 
        style={{...styles.headerBtn, appearance: 'none', paddingRight: '22px', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center'}}
        value={lang} 
        onChange={(e) => setLang(e.target.value)}
      >
        <option value="pt">PT</option>
        <option value="en">EN</option>
      </select>
      
      <div style={{...styles.headerBtn, padding: '6px'}} onClick={() => setIsDarkMode(!isDarkMode)}>
        {isDarkMode ? 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> : 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        }
      </div>
    </div>
  );

  const EyeIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
  const EyeOffIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>);

  return (
    <>
      <style>
        {`
          .auth-layout { display: flex; flex-direction: row-reverse; height: 100vh; width: 100%; background-color: ${theme.bg}; overflow: hidden; }
          .auth-left-panel { flex: 1; display: flex; flex-direction: column; padding: 32px; justify-content: center; background-color: ${theme.cardBg}; overflow: hidden; position: relative; }
          .auth-right-panel { flex: 1; background-color: ${theme.primary}; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; color: #ffffff; position: relative; overflow: hidden; }
          @media (max-width: 900px) { .auth-layout { flex-direction: column; } .auth-right-panel { display: none; } .auth-left-panel { padding: 24px; justify-content: center; } }
          @keyframes floatPadlock { 0% { transform: translate(-50%, -46%) rotate(-5deg) scale(1.8); } 50% { transform: translate(-50%, -54%) rotate(5deg) scale(1.9); } 100% { transform: translate(-50%, -46%) rotate(-5deg) scale(1.8); } }
          .parallax-padlock { animation: floatPadlock 12s ease-in-out infinite; transform-origin: center; filter: drop-shadow(0 40px 30px rgba(0, 0, 0, 0.4)); }
        `}
      </style>

      <div className="auth-layout">
        
        <div className="auth-left-panel">
          {renderHeaderActions()}
          
          <div style={styles.formContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: theme.textMain, letterSpacing: '-0.5px' }}>CyberLearn</span>
            </div>

            {/* VISTA LOGIN */}
            {view === 'login' && !show2FA && (
              <>
                <h1 style={styles.title}>{t('auth.welcome')}</h1>
                <p style={styles.subtitle}>{t('auth.subtitleLogin')}</p>
                <form onSubmit={handleSubmit}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.email')}</label>
                    {/* Placeholder Atualizado */}
                    <input style={styles.input} type="email" name="email" placeholder="Ex: nome@gmail.com" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{...styles.label, margin: 0}}>{t('auth.password')}</label>
                      <span style={{...styles.link, fontSize: '12px'}} onClick={() => setView('forgot')}>{t('auth.forgot')}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input style={styles.passwordInput} type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
                      <div style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </div>
                    </div>
                  </div>
                  <button type="submit" style={styles.button}>{t('auth.signIn')}</button>
                </form>
                <div style={{ marginTop: '20px', textAlign: 'center', color: theme.textSub, fontSize: '13px' }}>
                  {t('auth.noAccount')} <span style={styles.link} onClick={() => setView('register')}>{t('auth.signUp')}</span>
                </div>
              </>
            )}

            {/* VISTA REGISTO */}
            {view === 'register' && (
              <>
                <h1 style={styles.title}>{t('auth.createAccount')}</h1>
                <p style={styles.subtitle}>{t('auth.subtitleRegister')}</p>
                <form onSubmit={handleSubmit}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.fullName')}</label>
                    {/* Placeholder Atualizado */}
                    <input style={styles.input} type="text" name="nome" placeholder="Ex: Tomás Tavares" value={formData.nome || ''} onChange={handleInputChange} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.email')}</label>
                    {/* Placeholder Atualizado */}
                    <input style={styles.input} type="email" name="email" placeholder="Ex: nome@gmail.com" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.password')}</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        style={styles.passwordInput} 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        placeholder="••••••••" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        required 
                        pattern="(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}"
                        title={t('auth.passwordHint')}
                      />
                      <div style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: theme.textSub, marginTop: '6px', marginBottom: 0 }}>{t('auth.passwordHint')}</p>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.confirmPassword')}</label>
                    <div style={{ position: 'relative' }}>
                      <input style={styles.passwordInput} type={showConfirmPassword ? "text" : "password"} name="confirmarPassword" placeholder="••••••••" value={formData.confirmarPassword || ''} onChange={handleInputChange} required />
                      <div style={styles.eyeIcon} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </div>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.role')}</label>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '6px'}}>
                      <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain, cursor: 'pointer'}}>
                        <input type="radio" name="tipo" value="aluno" checked={formData.tipo === 'aluno'} onChange={handleInputChange} /> {t('auth.student')}
                      </label>
                      <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain, cursor: 'pointer'}}>
                        <input type="radio" name="tipo" value="professor" checked={formData.tipo === 'professor'} onChange={handleInputChange} /> {t('auth.instructor')}
                      </label>
                      <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMain, cursor: 'pointer'}}>
                        <input type="radio" name="tipo" value="admin" checked={formData.tipo === 'admin'} onChange={handleInputChange} /> {t('auth.admin')}
                      </label>
                    </div>
                  </div>
                  <button type="submit" style={styles.button}>{t('auth.createBtn')}</button>
                </form>
                <div style={{ marginTop: '20px', textAlign: 'center', color: theme.textSub, fontSize: '13px' }}>
                  {t('auth.hasAccount')} <span style={styles.link} onClick={() => setView('login')}>{t('auth.signIn')}</span>
                </div>
              </>
            )}

            {/* VISTA ESQUECI-ME DA SENHA */}
            {view === 'forgot' && (
              <>
                <div style={{ display: 'inline-block', padding: '12px', backgroundColor: `${theme.primary}15`, color: theme.primary, borderRadius: '12px', marginBottom: '24px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h1 style={styles.title}>{t('auth.resetTitle')}</h1>
                <p style={styles.subtitle}>{t('auth.resetSub')}</p>
                <form onSubmit={handleSubmit}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.email')}</label>
                    {/* Placeholder Atualizado */}
                    <input style={styles.input} type="email" name="email" placeholder="Ex: nome@gmail.com" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <button type="submit" style={styles.button}>{t('auth.sendLink')}</button>
                </form>
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <span style={{...styles.link, display: 'inline-flex', alignItems: 'center', gap: '8px'}} onClick={() => setView('login')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> {t('auth.backLogin')}
                  </span>
                </div>
              </>
            )}

            {/* VISTA REDEFINIR SENHA (NOVA SENHA + CÓDIGO) */}
            {view === 'reset' && (
              <>
                <h1 style={styles.title}>{t('auth.newPassTitle')}</h1>
                <p style={styles.subtitle}>{t('auth.newPassSub')}</p>
                <form onSubmit={handleSubmit}>
                  
                  <input type="hidden" name="codigoReset" value={otp.join('')} />
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.code')}</label>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                      {otp.map((data, index) => (
                        <input
                          style={styles.otpInput} type="text" name="otp" maxLength="1" key={index} value={data}
                          onChange={e => handleOtpChange(e.target, index)} onKeyDown={e => handleOtpKeyDown(e, index)} onFocus={e => e.target.select()}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.newPass')}</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        style={styles.passwordInput} 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        placeholder="••••••••" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        required 
                        pattern="(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}"
                        title={t('auth.passwordHint')}
                      />
                      <div style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: theme.textSub, marginTop: '6px', marginBottom: 0 }}>{t('auth.passwordHint')}</p>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.confirmNewPass')}</label>
                    <div style={{ position: 'relative' }}>
                      <input style={styles.passwordInput} type={showConfirmPassword ? "text" : "password"} name="confirmarPassword" placeholder="••••••••" value={formData.confirmarPassword || ''} onChange={handleInputChange} required />
                      <div style={styles.eyeIcon} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </div>
                    </div>
                  </div>
                  
                  <button type="submit" style={styles.button}>{t('auth.resetBtn')}</button>
                </form>
                
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <span style={{...styles.link, display: 'inline-flex', alignItems: 'center', gap: '8px'}} onClick={() => { setView('login'); setOtp(['', '', '', '', '', '']); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Cancelar
                  </span>
                </div>
              </>
            )}

            {/* VISTA LOGIN COM 2FA */}
            {view === 'login' && show2FA && (
              <>
                <h1 style={styles.title}>{t('auth.twoFaTitle')}</h1>
                <p style={styles.subtitle}>{t('auth.twoFaSub')}</p>
                <form onSubmit={handleSubmit}>
                  <input type="hidden" name="codigo2FA" value={otp.join('')} />
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{t('auth.code')}</label>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                      {otp.map((data, index) => (
                        <input
                          style={styles.otpInput} type="text" name="otp" maxLength="1" key={index} value={data}
                          onChange={e => handleOtpChange(e.target, index)} onKeyDown={e => handleOtpKeyDown(e, index)} onFocus={e => e.target.select()}
                        />
                      ))}
                    </div>
                  </div>
                  <button type="submit" style={styles.button}>{t('auth.verifyBtn')}</button>
                </form>
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <span style={{...styles.link, display: 'inline-flex', alignItems: 'center', gap: '8px'}} onClick={() => setShow2FA(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Voltar ao Login
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Branding */}
        <div className="auth-right-panel">
          <div style={{ position: 'absolute', top: '50%', left: '50%', opacity: 0.35 }}>
            <svg className="parallax-padlock" viewBox="0 0 200 200" width="400" height="400">
              <defs>
                <linearGradient id="bodyGradAuth" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="shackleGradAuth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="holeGradAuth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>
              <path d="M 50 90 L 50 50 C 50 10 150 10 150 50 L 150 90" fill="none" stroke="url(#shackleGradAuth)" strokeWidth="32" strokeLinecap="round" />
              <path d="M 60 90 L 60 50 C 60 20 140 20 140 50 L 140 90" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.8" />
              <rect x="25" y="80" width="150" height="105" rx="28" fill="url(#bodyGradAuth)" />
              <path d="M 25 105 L 175 105" stroke="#ffffff" strokeWidth="6" opacity="0.6" />
              <rect x="40" y="80" width="10" height="105" fill="#ffffff" opacity="0.3" />
              <circle cx="100" cy="120" r="14" fill="url(#holeGradAuth)" />
              <path d="M 92 125 L 108 125 L 105 155 L 95 155 Z" fill="url(#holeGradAuth)" />
            </svg>
          </div>
          
          <div style={{ zIndex: 1, textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#ffffff', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', lineHeight: '1.2', whiteSpace: 'pre-line' }}>{t('auth.brandTitle')}</h2>
            <p style={{ fontSize: '16px', opacity: 0.8, lineHeight: '1.6' }}>{t('auth.brandSub')}</p>
          </div>
        </div>
      </div>
    </>
  );
}
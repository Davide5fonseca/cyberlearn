export default function Licao({ setView, theme, isDarkMode, setIsDarkMode }) {
  const styles = {
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: `${theme.primary}20`, color: theme.primary },
    submitButton: { width: '100%', backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textTransform: 'uppercase' },
    iconBg: theme.iconBg,
    iconColor: theme.iconColor
  };

  const renderThemeToggle = () => (
    <div style={{ backgroundColor: styles.iconBg, padding: '8px', borderRadius: '8px', cursor: 'pointer', color: styles.iconColor }} onClick={() => setIsDarkMode(!isDarkMode)}>
      {isDarkMode ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
    </div>
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', minHeight: '100%'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: theme.textSub, cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'}} onClick={() => setView('cursos')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Voltar aos Cursos
        </div>
        {renderThemeToggle()}
      </div>

      <div style={{backgroundColor: theme.cardBg, borderRadius: '16px', padding: '40px', boxShadow: theme.shadow, flex: 1}}>
        <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
          <div style={styles.badge}>Módulo 1</div>
          <div style={{...styles.badge, backgroundColor: theme.inputBg, color: theme.textSub}}>Lição 1 de 5</div>
        </div>
        
        <h1 style={{color: theme.textMain, marginTop: 0, fontSize: '28px', marginBottom: '30px'}}>O que é o Phishing?</h1>
        
        <div style={{color: theme.textMain, fontSize: '15px', lineHeight: '1.8'}}>
          <p>O <strong>Phishing</strong> é uma das formas mais antigas e mais perigosas de ciberataques. Trata-se de uma técnica de engenharia social usada por hackers para enganar as pessoas.</p>
          
          <div style={{backgroundColor: theme.inputBg, borderLeft: `4px solid ${theme.primary}`, padding: '20px', margin: '30px 0', borderRadius: '0 8px 8px 0'}}>
            <h4 style={{margin: '0 0 10px 0', color: theme.primary, display: 'flex', alignItems: 'center', gap: '8px'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Dica de Segurança
            </h4>
            <p style={{margin: 0, color: theme.textSub, fontSize: '14px'}}>Os atacantes disfarçam-se frequentemente de entidades confiáveis para criar um sentido de urgência ou medo.</p>
          </div>

          <h3 style={{marginTop: '30px', color: theme.textMain}}>Sinais Vermelhos a procurar:</h3>
          <ul style={{color: theme.textSub}}>
            <li style={{marginBottom: '10px'}}><strong>Remetente estranho:</strong> O email diz ser do "PayPal", mas o endereço é <em>suporte@pay-pal-seguranca.xyz</em>.</li>
            <li style={{marginBottom: '10px'}}><strong>Erros ortográficos:</strong> Os emails oficiais são revistos várias vezes. Erros de gramática são um sinal claro de fraude.</li>
          </ul>
        </div>

        <div style={{width: '100%', height: '1px', backgroundColor: theme.inputBorder, margin: '40px 0'}}></div>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <button style={{backgroundColor: 'transparent', border: 'none', color: theme.textSub, cursor: 'not-allowed', fontWeight: 'bold', fontSize: '14px'}}>Anterior</button>
          <button style={{...styles.submitButton, width: 'auto', padding: '14px 24px', marginTop: 0}} onClick={() => { alert("Parabéns! Lição concluída. Ganháste +50 Pontos XP!"); setView('cursos'); }}>
            Concluir e Avançar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
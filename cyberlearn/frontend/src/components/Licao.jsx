import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useTranslation } from '../i18n';

export default function Licao({ setView, theme, curso, setTargetQuizCourse }) {
  const t = useTranslation();
  // Estado para saber em que lição o aluno está (começa na 0)
  const [currentLicaoIndex, setCurrentLicaoIndex] = useState(0);
  
  // NOVO ESTADO: Controla se o aluno chegou ao fim e quer ver o ecrã de conclusão
  const [cursoConcluido, setCursoConcluido] = useState(false);

  const styles = {
    container: { maxWidth: '850px', margin: '40px auto 60px auto', display: 'flex', flexDirection: 'column', gap: '25px', animation: 'fadeIn 0.4s ease' },
    headerBadges: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
    badge: { padding: '6px 12px', backgroundColor: `${theme.primary}20`, color: theme.primary, borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
    subBadge: { color: theme.textSub, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
    contentCard: { backgroundColor: theme.cardBg, borderRadius: '20px', padding: '50px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    title: { fontSize: '32px', fontWeight: '900', color: theme.textMain, margin: '0 0 30px 0', lineHeight: '1.2' },
    text: { fontSize: '16px', color: theme.textSub, lineHeight: '1.8' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '50px', paddingTop: '25px', borderTop: `1px solid ${theme.inputBorder}60` },
    backBtn: { backgroundColor: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.inputBorder}`, padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
    nextBtn: { backgroundColor: theme.primary, backgroundImage: theme.gradient, color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 4px 12px ${theme.primary}45`, transition: 'transform 0.2s' }
  };

  if (!curso) {
    return (
      <div style={styles.container}>
        <div style={{...styles.contentCard, textAlign: 'center', padding: '60px'}}>
           <h2 style={{color: theme.textMain}}>{t('aluno.licao.semCursoTitulo')}</h2>
           <p style={{color: theme.textSub}}>{t('aluno.licao.semCursoTexto')}</p>
           <button onClick={() => setView('cursos')} style={{...styles.nextBtn, margin: '20px auto 0 auto'}}>{t('aluno.licao.voltarCursos')}</button>
        </div>
      </div>
    );
  }

  let conteudosDasLicoes;
  try {
    conteudosDasLicoes = JSON.parse(curso.conteudo_licao);
    if (!Array.isArray(conteudosDasLicoes)) conteudosDasLicoes = [curso.conteudo_licao];
  } catch {
    conteudosDasLicoes = [curso.conteudo_licao];
  }

  const totalLicoes = conteudosDasLicoes.length;
  let licaoAtualHTML = conteudosDasLicoes[currentLicaoIndex] || t('aluno.licao.semConteudo');

  // Remove cores inline (estética: o tema controla as cores)...
  licaoAtualHTML = licaoAtualHTML
    .replace(/background-color:\s*[^;"]+;?/gi, '')
    .replace(/color:\s*[^;"]+;?/gi, '')
    .replace(/background:\s*[^;"]+;?/gi, '');
  // ...e sanitiza para prevenir XSS no conteúdo criado pelos professores.
  licaoAtualHTML = DOMPurify.sanitize(licaoAtualHTML, { USE_PROFILES: { html: true } });

  const handleNext = () => {
    if (currentLicaoIndex < totalLicoes - 1) {
      setCurrentLicaoIndex(currentLicaoIndex + 1);
      window.scrollTo(0, 0); 
    } else {
      setCursoConcluido(true);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentLicaoIndex > 0) {
      setCurrentLicaoIndex(currentLicaoIndex - 1);
      window.scrollTo(0, 0);
    } else {
      setView('cursos'); 
    }
  };

  if (cursoConcluido) {
    return (
      <div style={styles.container}>
        <div style={{...styles.contentCard, textAlign: 'center', padding: '60px 40px'}}>
           <div style={{ fontSize: '70px', marginBottom: '20px', animation: 'bounce 1s infinite alternate' }} aria-hidden="true">🎉</div>
           <h2 style={{color: theme.textMain, fontSize: '32px', marginBottom: '15px'}}>{t('aluno.licao.parabens')}</h2>
           <p style={{color: theme.textSub, fontSize: '16px', marginBottom: '40px', lineHeight: '1.6'}}>
             {t('aluno.licao.concluiste')} <strong>"{curso.titulo}"</strong>.<br/>{t('aluno.licao.prontoQuiz')}
           </p>

           <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => { setCursoConcluido(false); setCurrentLicaoIndex(0); window.scrollTo(0, 0); }}
                style={{ ...styles.backBtn, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '10px' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                {t('aluno.licao.reler')}
              </button>

              <button 
                // AQUI GRAVAMOS O ALVO E MUDAMOS DE PÁGINA
                onClick={() => {
                  if (setTargetQuizCourse) setTargetQuizCourse(curso.titulo);
                  setView('quizzes');
                }}
                style={styles.nextBtn}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t('aluno.licao.fazerQuiz')}
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </button>
           </div>
        </div>
        <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-15px); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          .licao-html-dinamico * { color: ${theme.textMain} !important; }
          .licao-html-dinamico blockquote, .licao-html-dinamico div[style*="padding"] {
            background-color: ${theme.inputBg} !important;
            border-left: 4px solid ${theme.primary} !important;
            padding: 15px 20px !important; border-radius: 8px !important; margin: 20px 0 !important;
          }
          .licao-html-dinamico h1, .licao-html-dinamico h2, .licao-html-dinamico h3 { color: ${theme.textMain} !important; margin-top: 30px; }
        `}
      </style>

      <div style={styles.contentCard}>
        <div style={styles.headerBadges}>
          <span style={styles.badge}>{curso.titulo}</span>
          <span style={styles.subBadge}>{t('aluno.licao.licao')} {currentLicaoIndex + 1} {t('aluno.licao.de')} {totalLicoes}</span>
        </div>
        
        <h1 style={styles.title}>
          {totalLicoes > 1 ? `${t('aluno.licao.parte')} ${currentLicaoIndex + 1}` : curso.titulo}
        </h1>
        
        <div className="licao-html-dinamico" style={styles.text} dangerouslySetInnerHTML={{ __html: licaoAtualHTML }} />

        <div style={styles.footer}>
          <button style={styles.backBtn} onClick={handlePrev} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}>
            {currentLicaoIndex === 0 ? t('aluno.licao.abandonar') : t('aluno.licao.anterior')}
          </button>
          <button style={styles.nextBtn} onClick={handleNext} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            {currentLicaoIndex === totalLicoes - 1 ? t('aluno.licao.concluir') : t('aluno.licao.proxima')}
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
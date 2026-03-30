/* eslint-disable react/prop-types */
import { useState } from 'react';

export default function Licao({ setView, theme, curso }) {
  // Estado para saber em que lição o aluno está (começa na 0)
  const [currentLicaoIndex, setCurrentLicaoIndex] = useState(0);

  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' },
    headerBadges: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
    badge: { padding: '6px 12px', backgroundColor: `${theme.primary}20`, color: theme.primary, borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
    subBadge: { color: theme.textSub, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
    contentCard: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '40px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    title: { fontSize: '32px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 30px 0', lineHeight: '1.2' },
    text: { fontSize: '16px', color: theme.textSub, lineHeight: '1.8' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '50px', paddingTop: '25px', borderTop: `1px solid ${theme.inputBorder}60` },
    backBtn: { backgroundColor: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.inputBorder}`, padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
    nextBtn: { backgroundColor: theme.primary, color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 4px 12px ${theme.primary}50`, transition: 'transform 0.2s' }
  };

  if (!curso) {
    return (
      <div style={styles.container}>
        <div style={{...styles.contentCard, textAlign: 'center', padding: '60px'}}>
           <h2 style={{color: theme.textMain}}>Nenhum curso selecionado.</h2>
           <p style={{color: theme.textSub}}>Por favor, volta ao catálogo e escolhe um curso.</p>
           <button onClick={() => setView('cursos')} style={{...styles.nextBtn, margin: '20px auto 0 auto'}}>Voltar aos Cursos</button>
        </div>
      </div>
    );
  }

  // Descodificar o texto da Base de Dados de volta para uma Lista
  let conteudosDasLicoes = [];
  try {
    conteudosDasLicoes = JSON.parse(curso.conteudo_licao);
    if (!Array.isArray(conteudosDasLicoes)) conteudosDasLicoes = [curso.conteudo_licao];
  } catch (error) {
    // Se por acaso houver um erro a ler o JSON, assume que o texto é todo uma única lição
    conteudosDasLicoes = [curso.conteudo_licao];
  }

  const totalLicoes = conteudosDasLicoes.length;
  const licaoAtualHTML = conteudosDasLicoes[currentLicaoIndex] || "O professor ainda não adicionou conteúdo a esta lição.";

  const handleNext = () => {
    if (currentLicaoIndex < totalLicoes - 1) {
      setCurrentLicaoIndex(currentLicaoIndex + 1); // Avança para a próxima lição
      window.scrollTo(0, 0); // Sobe a página para o topo
    } else {
      setView('quizzes'); // Vai para os testes no fim do curso
    }
  };

  const handlePrev = () => {
    if (currentLicaoIndex > 0) {
      setCurrentLicaoIndex(currentLicaoIndex - 1); // Volta para a lição anterior
      window.scrollTo(0, 0);
    } else {
      setView('cursos'); // Volta ao catálogo
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentCard}>
        
        <div style={styles.headerBadges}>
          <span style={styles.badge}>{curso.titulo}</span>
          <span style={styles.subBadge}>Lição {currentLicaoIndex + 1} de {totalLicoes}</span>
        </div>
        
        <h1 style={styles.title}>
          {totalLicoes > 1 ? `Parte ${currentLicaoIndex + 1}` : curso.titulo}
        </h1>
        
        <div 
          style={styles.text} 
          dangerouslySetInnerHTML={{ __html: licaoAtualHTML }} 
        />

        <div style={styles.footer}>
          <button 
            style={styles.backBtn} 
            onClick={handlePrev}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
          >
            {currentLicaoIndex === 0 ? "Voltar ao Catálogo" : "Lição Anterior"}
          </button>
          
          <button 
            style={styles.nextBtn} 
            onClick={handleNext}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {currentLicaoIndex === totalLicoes - 1 ? "CONCLUIR CURSO" : "PRÓXIMA LIÇÃO"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
        
      </div>
    </div>
  );
}
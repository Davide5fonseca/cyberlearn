import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Cursos({ setView, theme, setActiveCourse }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarCursos();
  }, []);

  const buscarCursos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/cursos');
      if (response.ok) {
        const data = await response.json();
        setCursos(data); 
      }
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const contarLicoes = (conteudoJSON) => {
    try {
      const parsed = JSON.parse(conteudoJSON);
      if (Array.isArray(parsed)) return parsed.length;
      return 1;
    } catch {
      return 1; 
    }
  };

  const getGradient = (nivel) => {
    const n = String(nivel).toLowerCase();
    if (n === 'avancado') return 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)';
    if (n === 'intermedio') return 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
    return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'; // Iniciante
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px', animation: 'fadeIn 0.4s ease' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}50` },
    title: { color: theme.textMain, fontSize: '26px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
    
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}40`, display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', cursor: 'pointer', height: '100%' },
    
    imagePlaceholder: (nivel) => ({ 
      height: '160px', 
      background: getGradient(nivel), 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      color: 'rgba(255,255,255,0.8)', 
      position: 'relative'
    }),
    
    badgeNivelAbsoluto: (nivel) => {
      const color = nivel === 'avancado' ? '#ef4444' : nivel === 'intermedio' ? '#f59e0b' : '#10b981';
      return { position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: color, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', border: `1px solid ${color}50` };
    },
    
    cardBody: { padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 },
    courseTitle: { fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 12px 0', lineHeight: '1.4' },
    
    metaRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '16px', flexWrap: 'wrap' },
    metaItem: { fontSize: '12px', color: theme.textSub, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', backgroundColor: theme.inputBg, padding: '4px 8px', borderRadius: '6px' },
    
    courseDesc: { fontSize: '14px', color: theme.textSub, margin: '0 0 24px 0', lineHeight: '1.6', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }, // Corta o texto em 3 linhas
    
    button: { width: '100%', padding: '14px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 12px ${theme.primary}40`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <div style={{ backgroundColor: `${theme.primary}20`, padding: '10px', borderRadius: '12px', display: 'flex', color: theme.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            </div>
            Catálogo de Cursos
          </h1>
          <p style={{color: theme.textSub, margin: '10px 0 0 0', fontSize: '14px', fontWeight: '500'}}>Explora os módulos de aprendizagem criados pelos teus professores.</p>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '60px', color: theme.textSub, fontWeight: 'bold'}}>
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginBottom: '15px', animation: 'spin 2s linear infinite'}}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
           <br/>A carregar o catálogo de cursos...
        </div>
      ) : cursos.length === 0 ? (
        <div style={{textAlign: 'center', padding: '80px 20px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `2px dashed ${theme.inputBorder}`}}>
          <div style={{ backgroundColor: theme.inputBg, width: '70px', height: '70px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto', color: theme.textSub }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3 style={{color: theme.textMain, margin: '0 0 10px 0', fontSize: '18px'}}>Nenhum curso disponível</h3>
          <p style={{color: theme.textSub, fontSize: '14px', margin: 0}}>Os professores ainda não publicaram nenhum conteúdo.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {cursos.map(curso => {
            const numLicoes = contarLicoes(curso.conteudo_licao);
            
            return (
              <div 
                key={curso.id} 
                style={styles.card} 
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.2)`; }} 
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow; }}
              >
                <div style={styles.imagePlaceholder(curso.nivel)}>
                  <span style={styles.badgeNivelAbsoluto(curso.nivel)}>{curso.nivel || 'Iniciante'}</span>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                
                <div style={styles.cardBody}>
                  <h3 style={styles.courseTitle}>{curso.titulo}</h3>
                  
                  <div style={styles.metaRow}>
                    <span style={styles.metaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      Prof. {curso.nome_professor || 'Desconhecido'}
                    </span>
                    <span style={styles.metaItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      {numLicoes} {numLicoes === 1 ? 'Lição' : 'Lições'}
                    </span>
                  </div>
                  
                  <p style={styles.courseDesc} title={curso.descricao}>{curso.descricao}</p>
                  
                  <button 
                    style={styles.button} 
                    onClick={() => {
                      setActiveCourse(curso);
                      setView('licao');
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.textUniversal; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    Iniciar Módulo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
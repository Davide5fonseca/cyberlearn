/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

// ALTERADO: Recebe agora a propriedade setActiveCourse
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

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px', animation: 'fadeIn 0.4s ease' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, padding: '24px', borderRadius: '16px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    title: { color: theme.textMain, fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' },
    
    imagePlaceholder: (nivel) => {
      const color = nivel === 'avancado' ? theme.danger : nivel === 'intermedio' ? theme.warning : theme.success;
      return { height: '140px', backgroundColor: `${color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: color, borderBottom: `1px solid ${theme.inputBorder}` };
    },
    
    cardBody: { padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 },
    courseTitle: { fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 8px 0', lineHeight: '1.3' },
    courseProf: { fontSize: '13px', color: theme.textSub, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' },
    courseDesc: { fontSize: '14px', color: theme.textSub, margin: '0 0 24px 0', lineHeight: '1.5', flex: 1 },
    button: { width: '100%', padding: '12px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: `0 4px 10px ${theme.primary}40` },
    
    badge: (nivel) => {
      const color = nivel === 'avancado' ? theme.danger : nivel === 'intermedio' ? theme.warning : theme.success;
      return { display: 'inline-block', padding: '6px 12px', backgroundColor: `${color}20`, color: color, borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', alignSelf: 'flex-start', letterSpacing: '0.5px' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            Catálogo de Cursos
          </h1>
          <p style={{color: theme.textSub, margin: '8px 0 0 0', fontSize: '14px'}}>Explora os módulos de aprendizagem criados pelos teus professores.</p>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '60px', color: theme.textSub}}>
           A carregar o catálogo de cursos da base de dados...
        </div>
      ) : cursos.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `2px dashed ${theme.inputBorder}`}}>
          <div style={{ backgroundColor: theme.inputBg, width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto' }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3 style={{color: theme.textMain, margin: '0 0 8px 0'}}>Nenhum curso disponível</h3>
          <p style={{color: theme.textSub, fontSize: '14px', margin: 0}}>Os professores ainda não publicaram nenhum conteúdo.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {cursos.map(curso => (
            <div key={curso.id} style={styles.card} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={styles.imagePlaceholder(curso.nivel)}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              </div>
              <div style={styles.cardBody}>
                <span style={styles.badge(curso.nivel)}>{curso.nivel || 'Iniciante'}</span>
                <h3 style={styles.courseTitle}>{curso.titulo}</h3>
                
                <p style={styles.courseProf}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Prof. {curso.nome_professor || 'Desconhecido'}
                </p>
                
                <p style={styles.courseDesc}>{curso.descricao}</p>
                
                <button 
                  style={styles.button} 
                  onClick={() => {
                    // ALTERADO AQUI: Guarda o curso antes de abrir a lição!
                    setActiveCourse(curso);
                    setView('licao');
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.textUniversal}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                >
                  Iniciar Módulo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
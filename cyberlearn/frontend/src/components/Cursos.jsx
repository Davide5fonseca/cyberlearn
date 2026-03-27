import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Cursos({ setView, theme }) {
  const [cursosReais, setCursosReais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await apiFetch('/cursos');
        const data = await response.json();
        if (response.ok) {
          setCursosReais(data);
        }
      } catch (error) {
        console.error("Erro ao carregar os cursos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, []);

  const styles = {
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    courseCard: { backgroundColor: theme.cardBg, borderRadius: '12px', overflow: 'hidden', boxShadow: theme.shadow, transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column' },
    
    // MUDANÇA: Proteção máxima! Forçamos a conversão para texto antes de usar toLowerCase()
    badge: (nivel) => {
      const n = String(nivel || 'iniciante').toLowerCase();
      
      return {
        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px', alignSelf: 'flex-start',
        backgroundColor: n === 'iniciante' ? `${theme.success}20` : n === 'avancado' ? `${theme.danger}20` : `${theme.warning}20`,
        color: n === 'iniciante' ? theme.success : n === 'avancado' ? theme.danger : theme.warning
      };
    },
    
    submitButton: { width: '100%', backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', textTransform: 'uppercase' }
  };

  if (loading) {
    return <p style={{color: theme.textSub, textAlign: 'center', marginTop: '50px'}}>A carregar cursos da Base de Dados...</p>;
  }

  if (cursosReais.length === 0) {
    return (
      <div style={{textAlign: 'center', padding: '50px', backgroundColor: theme.cardBg, borderRadius: '12px'}}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5" style={{marginBottom: '15px'}}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
        <h3 style={{color: theme.textMain, margin: '0 0 10px 0'}}>Nenhum curso disponível</h3>
        <p style={{color: theme.textSub, margin: 0}}>Os professores ainda não publicaram nenhum curso na plataforma.</p>
      </div>
    );
  }

  return (
    <div style={styles.courseGrid}>
      {cursosReais.map((curso) => (
        <div key={curso.id} style={styles.courseCard}>
          <div style={{width: '100%', height: '140px', backgroundColor: theme.inputBg, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>
          </div>
          <div style={{padding: '20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
            
            {/* MUDANÇA: Passamos apenas a variável (sem fazer toLowerCase aqui!) */}
            <div style={styles.badge(curso.nivel)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> 
              {curso.nivel || 'Iniciante'}
            </div>
            
            {/* Adicionei também proteção caso o curso não tenha título ou descrição */}
            <h4 style={{fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '10px 0 5px 0'}}>{curso.titulo || 'Curso sem título'}</h4>
            <p style={{fontSize: '13px', color: theme.textSub, margin: '0 0 20px 0', lineHeight: '1.4'}}>{curso.descricao || 'Sem descrição.'}</p>
            
            <button style={styles.submitButton} onClick={() => setView('licao')}>Começar Curso</button>
          </div>
        </div>
      ))}
    </div>
  );
}
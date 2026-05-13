import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function AdminAprovacoes({ theme }) {
  const [pendentes, setPendentes] = useState({ cursos: [], quizzes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarPendentes();
  }, []);

  const buscarPendentes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/pendentes');
      if (res.ok) setPendentes(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (tipo, identificador) => {
    try {
      // Usar encodeURIComponent para proteger títulos com espaços (ex: "Teste Final")
      const res = await apiFetch(`/admin/aprovar/${tipo}/${encodeURIComponent(identificador)}`, { method: 'PUT' });
      if (res.ok) buscarPendentes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejeitar = async (tipo, identificador) => {
    if (!window.confirm(`Tens a certeza que queres REJEITAR e APAGAR este ${tipo}?`)) return;
    try {
      // Usar encodeURIComponent para proteger títulos com espaços
      const res = await apiFetch(`/admin/rejeitar/${tipo}/${encodeURIComponent(identificador)}`, { method: 'DELETE' });
      if (res.ok) buscarPendentes();
    } catch (err) {
      console.error(err);
    }
  };

  const styles = {
    container: { width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: '0 0 16px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: theme.inputBg, borderRadius: '12px', border: `1px solid ${theme.inputBorder}50`, marginBottom: '12px', gap: '16px', flexWrap: 'wrap', transition: 'all 0.2s', ':hover': { borderColor: theme.primary } },
    btnAprovar: { backgroundColor: theme.success || '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' },
    btnRejeitar: { backgroundColor: 'transparent', color: theme.danger || '#ef4444', border: `1px solid ${theme.danger}50`, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s' }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '40px', color: theme.textSub}}>A verificar pendentes...</div>;

  return (
    <div style={styles.container}>
      {/* SECÇÃO CURSOS */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
          Cursos Pendentes ({pendentes.cursos.length})
        </h2>
        {pendentes.cursos.length === 0 ? (
          <div style={{ backgroundColor: theme.inputBg, padding: '20px', borderRadius: '12px', textAlign: 'center', color: theme.textSub, fontSize: '14px', border: `1px dashed ${theme.inputBorder}` }}>
            Nenhum curso a aguardar aprovação.
          </div>
        ) : (
          pendentes.cursos.map(curso => (
            <div key={curso.id} style={styles.itemRow} onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.primary}50`} onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.inputBorder}50`}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.textMain }}>{curso.titulo}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textSub }}>Prof: <strong>{curso.nome_professor}</strong> • Nível: <span style={{ textTransform: 'capitalize' }}>{curso.nivel}</span></p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={styles.btnRejeitar} 
                  onClick={() => handleRejeitar('curso', curso.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Rejeitar
                </button>
                <button 
                  style={styles.btnAprovar} 
                  onClick={() => handleAprovar('curso', curso.id)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Aprovar Curso
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SECÇÃO QUIZZES */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.warning || '#f59e0b'} strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Quizzes Pendentes ({pendentes.quizzes.length})
        </h2>
        {pendentes.quizzes.length === 0 ? (
          <div style={{ backgroundColor: theme.inputBg, padding: '20px', borderRadius: '12px', textAlign: 'center', color: theme.textSub, fontSize: '14px', border: `1px dashed ${theme.inputBorder}` }}>
            Nenhum quiz a aguardar aprovação.
          </div>
        ) : (
          pendentes.quizzes.map((quiz, index) => (
            <div key={index} style={styles.itemRow} onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.warning}50`} onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.inputBorder}50`}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.textMain }}>{quiz.titulo}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textSub }}>Curso: <strong>{quiz.nome_curso}</strong> • Prof: <strong>{quiz.nome_professor}</strong> • {quiz.num_perguntas} Perguntas</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={styles.btnRejeitar} 
                  onClick={() => handleRejeitar('quiz', quiz.titulo)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Rejeitar
                </button>
                <button 
                  style={{ ...styles.btnAprovar, backgroundColor: theme.warning || '#f59e0b', color: '#fff' }} 
                  onClick={() => handleAprovar('quiz', quiz.titulo)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Aprovar Quiz
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
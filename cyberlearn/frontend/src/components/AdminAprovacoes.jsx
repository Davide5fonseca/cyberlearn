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
      // O 'identificador' vai ser o ID (para cursos) ou o Título (para quizzes)
      const res = await apiFetch(`/admin/aprovar/${tipo}/${identificador}`, { method: 'PUT' });
      if (res.ok) buscarPendentes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejeitar = async (tipo, identificador) => {
    if (!window.confirm(`Tens a certeza que queres REJEITAR e APAGAR este ${tipo}?`)) return;
    try {
      const res = await apiFetch(`/admin/rejeitar/${tipo}/${identificador}`, { method: 'DELETE' });
      if (res.ok) buscarPendentes();
    } catch (err) {
      console.error(err);
    }
  };

  const styles = {
    container: { width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: '0 0 16px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: theme.inputBg, borderRadius: '12px', border: `1px solid ${theme.inputBorder}50`, marginBottom: '12px', gap: '16px', flexWrap: 'wrap' },
    btnAprovar: { backgroundColor: theme.success || '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
    btnRejeitar: { backgroundColor: 'transparent', color: theme.danger || '#ef4444', border: `1px solid ${theme.danger}50`, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }
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
        {pendentes.cursos.length === 0 ? <p style={{color: theme.textSub, fontSize: '14px'}}>Nenhum curso a aguardar aprovação.</p> : (
          pendentes.cursos.map(curso => (
            <div key={curso.id} style={styles.itemRow}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.textMain }}>{curso.titulo}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textSub }}>Prof: {curso.nome_professor} • Nível: {curso.nivel}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.btnRejeitar} onClick={() => handleRejeitar('curso', curso.id)}>Rejeitar</button>
                <button style={styles.btnAprovar} onClick={() => handleAprovar('curso', curso.id)}>Aprovar Curso</button>
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
        {pendentes.quizzes.length === 0 ? <p style={{color: theme.textSub, fontSize: '14px'}}>Nenhum quiz a aguardar aprovação.</p> : (
          pendentes.quizzes.map((quiz, index) => (
            <div key={index} style={styles.itemRow}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.textMain }}>{quiz.titulo}</h3>
                {/* Agora mostra o número de perguntas que compõem este Quiz */}
                <p style={{ margin: 0, fontSize: '12px', color: theme.textSub }}>Curso: {quiz.nome_curso} • Prof: {quiz.nome_professor} • <strong>{quiz.num_perguntas} Perguntas</strong></p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Repara que agora enviamos quiz.titulo em vez de ID */}
                <button style={styles.btnRejeitar} onClick={() => handleRejeitar('quiz', quiz.titulo)}>Rejeitar</button>
                <button style={styles.btnAprovar} onClick={() => handleAprovar('quiz', quiz.titulo)}>Aprovar Quiz Completo</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
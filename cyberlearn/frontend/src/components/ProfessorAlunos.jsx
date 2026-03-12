export default function ProfessorAlunos({ theme }) {
  const styles = {
    card: { backgroundColor: theme.cardBg, borderRadius: '10px', padding: '20px', boxShadow: theme.shadow },
    sectionTitle: { fontSize: '16px', color: theme.textMain, marginBottom: '15px', marginTop: 0, fontWeight: 'bold' }
  };

  return (
    <>
      <h1 style={{ color: theme.textMain, marginBottom: '20px', fontSize: '20px' }}>Alunos: Notas e Progresso</h1>
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Análise da Turma</h2>
        <div style={{textAlign: 'center', padding: '30px', border: `1px dashed ${theme.inputBorder}`, borderRadius: '8px', backgroundColor: theme.inputBg}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5" style={{marginBottom: '10px'}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <p style={{color: theme.textSub, margin: 0, fontWeight: 'bold', fontSize: '13px'}}>Sem dados para apresentar.</p>
          <p style={{color: theme.textSub, fontSize: '12px'}}>Os teus alunos precisam de concluir os teus cursos para aparecerem aqui.</p>
        </div>
      </div>
    </>
  );
}
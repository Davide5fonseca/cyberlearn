import { useState, useEffect } from 'react';

export default function ProfessorDashboard({ theme, user }) {
  // Adicionámos 'analytics' aos separadores
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [loginsReais, setLoginsReais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllLogins, setShowAllLogins] = useState(false); 

  // ==========================================
  // DADOS SIMULADOS PARA OS ANALYTICS
  // ==========================================
  const mockAnalytics = [
    { id: 1, nome: 'Davide Fonseca', curso: 'Ataques de Phishing', progresso: 100, nota: '18/20', status: 'Concluído' },
    { id: 2, nome: 'Maria Santos', curso: 'Criptografia Aplicada', progresso: 50, nota: '-', status: 'Em Curso' },
    { id: 3, nome: 'Tiago Mendes', curso: 'Ataques de Phishing', progresso: 100, nota: '8/20', status: 'Reprovado' },
    { id: 4, nome: 'Ana Rita', curso: 'Fundamentos de Redes', progresso: 15, nota: '-', status: 'Em Curso' },
  ];

  useEffect(() => {
    if (activeTab === 'logins') {
      buscarAcessos();
      setShowAllLogins(false);
    }
  }, [activeTab]);

  const buscarAcessos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/acessos');
      const data = await response.json();
      if (response.ok) {
        setLoginsReais(data);
      }
    } catch (error) {
      console.error("Erro de ligação:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert("Na versão final, isto fará o download direto de um ficheiro .pdf. Por agora, escolhe 'Guardar como PDF' no menu de impressão.");
    window.print(); 
  };

  const handleSubmitCurso = (e) => { e.preventDefault(); alert("Curso criado com sucesso!"); setActiveTab('logins'); };
  const handleSubmitQuiz = (e) => { e.preventDefault(); alert("Quiz criado com sucesso!"); setActiveTab('logins'); };

  const styles = {
    tabsContainer: { display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: `2px solid ${theme.inputBorder}`, paddingBottom: '15px', overflowX: 'auto' },
    tabButton: (isActive) => ({ backgroundColor: isActive ? theme.primary : 'transparent', color: isActive ? 'white' : theme.textSub, border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }),
    card: { backgroundColor: theme.cardBg, borderRadius: '12px', padding: '30px', boxShadow: theme.shadow },
    sectionTitle: { fontSize: '20px', color: theme.textMain, marginBottom: '20px', marginTop: 0, fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: theme.textMain, fontSize: '14px' },
    th: { padding: '15px', borderBottom: `2px solid ${theme.inputBorder}`, color: theme.textSub, textTransform: 'uppercase', fontSize: '12px' },
    td: { padding: '15px', borderBottom: `1px solid ${theme.inputBorder}` },
    inputWrapper: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '12px', color: theme.textSub, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' },
    input: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' },
    submitButton: { backgroundColor: theme.primary, color: 'white', border: 'none', padding: '14px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' },
    statCard: { backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.3s ease' },
    statNumber: { fontSize: '24px', fontWeight: 'bold', color: theme.textMain, margin: 0 },
    statLabel: { fontSize: '11px', color: theme.textSub, textTransform: 'uppercase', marginTop: '4px', fontWeight: '600' },
    
    // Estilos Específicos para a barra de progresso
    progressBarBg: { width: '100%', height: '8px', backgroundColor: theme.inputBg, borderRadius: '4px', overflow: 'hidden', marginTop: '5px' },
    progressBarFill: (percent) => ({ width: `${percent}%`, height: '100%', backgroundColor: percent === 100 ? theme.success : theme.primary, borderRadius: '4px' }),
    statusBadge: (status) => ({
      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-block',
      backgroundColor: status === 'Concluído' ? `${theme.success}20` : status === 'Reprovado' ? `${theme.danger}20` : `${theme.warning}20`,
      color: status === 'Concluído' ? theme.success : status === 'Reprovado' ? theme.danger : theme.warning
    })
  };

  return (
    <>
      <div style={styles.tabsContainer}>
        {/* NOVO BOTAO: ANALYTICS (Coloquei em primeiro lugar para veres logo) */}
        <button style={styles.tabButton(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          Progresso & Notas
        </button>
        <button style={styles.tabButton(activeTab === 'logins')} onClick={() => setActiveTab('logins')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          Atividade & Logins
        </button>
        <button style={styles.tabButton(activeTab === 'createCourse')} onClick={() => setActiveTab('createCourse')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          Criar Curso
        </button>
        <button style={styles.tabButton(activeTab === 'createQuiz')} onClick={() => setActiveTab('createQuiz')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          Criar Quiz
        </button>
      </div>

      {/* ========================================== */}
      {/* VISTA 1: ANALYTICS E NOTAS                 */}
      {/* ========================================== */}
      {activeTab === 'analytics' && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{padding: '12px', backgroundColor: `${theme.primary}20`, borderRadius: '10px', color: theme.primary}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
              <div><h3 style={styles.statNumber}>68%</h3><p style={styles.statLabel}>Média da Turma</p></div>
            </div>
            <div style={styles.statCard}>
              <div style={{padding: '12px', backgroundColor: '#10b98120', borderRadius: '10px', color: '#10b981'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
              <div><h3 style={styles.statNumber}>12</h3><p style={styles.statLabel}>Cursos Concluídos</p></div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={styles.sectionTitle}>Progresso dos Alunos</h2>
              <select style={{...styles.input, width: 'auto', padding: '8px 15px'}}>
                <option>Todos os Cursos</option>
                <option>Ataques de Phishing</option>
                <option>Criptografia Aplicada</option>
              </select>
            </div>

            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Aluno</th>
                    <th style={styles.th}>Curso / Módulo</th>
                    <th style={styles.th}>Progresso</th>
                    <th style={styles.th}>Nota do Quiz</th>
                    <th style={styles.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAnalytics.map((item) => (
                    <tr key={item.id}>
                      <td style={{...styles.td, fontWeight: 'bold'}}>{item.nome}</td>
                      <td style={{...styles.td, color: theme.textSub}}>{item.curso}</td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px'}}>
                          <span>{item.progresso}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={styles.progressBarFill(item.progresso)}></div>
                        </div>
                      </td>
                      <td style={{...styles.td, fontWeight: 'bold', color: item.nota.startsWith('1') ? theme.success : item.nota === '-' ? theme.textSub : theme.danger}}>
                        {item.nota}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(item.status)}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* VISTA 2: ATIVIDADE E LOGINS (Mantém-se)    */}
      {/* ========================================== */}
      {activeTab === 'logins' && (
        <>
          {showAllLogins ? (
            <div style={styles.card}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <button style={{backgroundColor: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'}} onClick={() => setShowAllLogins(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Voltar
                  </button>
                  <h2 style={{...styles.sectionTitle, margin: 0}}>Histórico Completo de Alunos</h2>
                </div>
                <button style={{...styles.submitButton, backgroundColor: '#ef4444'}} onClick={handleExportPDF}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 18 15 15"></polyline></svg> Exportar PDF
                </button>
              </div>
              
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr><th style={styles.th}>ID</th><th style={styles.th}>Nome do Aluno</th><th style={styles.th}>Email</th><th style={styles.th}>Data/Hora</th></tr>
                  </thead>
                  <tbody>
                    {loginsReais.map(login => (
                      <tr key={login.id}>
                        <td style={styles.td}>#{login.id}</td><td style={{...styles.td, fontWeight: 'bold'}}>{login.nome}</td>
                        <td style={{...styles.td, color: theme.textSub}}>{login.email}</td><td style={styles.td}>{login.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          ) : (
            
            <>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{padding: '12px', backgroundColor: `${theme.primary}20`, borderRadius: '10px', color: theme.primary}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                  <div><h3 style={styles.statNumber}>{loginsReais.length}</h3><p style={styles.statLabel}>Logins de Alunos</p></div>
                </div>
                <div style={styles.statCard}>
                  <div style={{padding: '12px', backgroundColor: '#10b98120', borderRadius: '10px', color: '#10b981'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div>
                  <div><h3 style={styles.statNumber}>4</h3><p style={styles.statLabel}>Cursos Ativos</p></div>
                </div>
                <div style={styles.statCard}>
                  <div style={{padding: '12px', backgroundColor: '#f59e0b20', borderRadius: '10px', color: '#f59e0b'}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                  <div><h3 style={styles.statNumber}>12</h3><p style={styles.statLabel}>Quizzes Criados</p></div>
                </div>
              </div>

              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Últimos 3 Acessos de Alunos</h2>
                
                {loading ? (
                  <p style={{color: theme.textSub}}>A carregar acessos da base de dados...</p>
                ) : loginsReais.length === 0 ? (
                  <p style={{color: theme.textSub, fontStyle: 'italic', margin: '20px 0'}}>
                    Ainda não existem logins de alunos registados.<br/>
                    (Os teus próprios logins como professor não contam para esta lista).
                  </p>
                ) : (
                  <>
                    <div style={{overflowX: 'auto'}}>
                      <table style={styles.table}>
                        <thead>
                          <tr><th style={styles.th}>ID</th><th style={styles.th}>Nome do Aluno</th><th style={styles.th}>Data/Hora</th></tr>
                        </thead>
                        <tbody>
                          {loginsReais.slice(0, 3).map(login => (
                            <tr key={login.id}>
                              <td style={styles.td}>#{login.id}</td>
                              <td style={{...styles.td, fontWeight: 'bold'}}>{login.nome}</td>
                              <td style={styles.td}>{login.data}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {loginsReais.length > 3 && (
                      <button style={{...styles.submitButton, width: '100%', justifyContent: 'center', backgroundColor: theme.inputBg, color: theme.primary, marginTop: '20px'}} onClick={() => setShowAllLogins(true)}>
                        Ver Histórico Completo ({loginsReais.length} Acessos)
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* VISTA 3: CRIAR CURSO */}
      {activeTab === 'createCourse' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Publicar Novo Curso</h2>
          <form onSubmit={handleSubmitCurso}>
            <div style={{display: 'flex', gap: '20px'}}>
              <div style={{...styles.inputWrapper, flex: 2}}><label style={styles.label}>Título do Curso</label><input style={styles.input} type="text" placeholder="Ex: Fundamentos de Cibersegurança" required /></div>
              <div style={{...styles.inputWrapper, flex: 1}}><label style={styles.label}>Nível de Dificuldade</label><select style={styles.input}><option value="iniciante">Iniciante</option><option value="intermedio">Intermédio</option><option value="avancado">Avançado</option></select></div>
            </div>
            <div style={styles.inputWrapper}><label style={styles.label}>Descrição Rápida (Aparece no Cartão)</label><textarea style={styles.textarea} placeholder="Descreve o que os alunos vão aprender..."></textarea></div>
            <div style={styles.inputWrapper}><label style={styles.label}>Conteúdo da Primeira Lição (Opcional)</label><textarea style={{...styles.textarea, minHeight: '150px'}} placeholder="Escreve aqui o texto teórico para a primeira lição..."></textarea></div>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}><button type="submit" style={styles.submitButton}>Publicar Curso</button></div>
          </form>
        </div>
      )}

      {/* VISTA 4: CRIAR QUIZ */}
      {activeTab === 'createQuiz' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Construir Novo Quiz</h2>
          <form onSubmit={handleSubmitQuiz}>
            <div style={{display: 'flex', gap: '20px'}}>
              <div style={{...styles.inputWrapper, flex: 1}}><label style={styles.label}>Título do Quiz</label><input style={styles.input} type="text" placeholder="Ex: Avaliação de Redes" required /></div>
              <div style={{...styles.inputWrapper, flex: 1}}><label style={styles.label}>Associar a um Curso</label><select style={styles.input}><option>Fundamentos de Redes</option><option>Ataques de Phishing</option></select></div>
            </div>
            <div style={{backgroundColor: theme.inputBg, padding: '20px', borderRadius: '8px', border: `1px dashed ${theme.inputBorder}`, marginBottom: '20px'}}>
              <h4 style={{color: theme.textMain, margin: '0 0 15px 0'}}>Pergunta 1</h4>
              <input style={{...styles.input, marginBottom: '15px'}} type="text" placeholder="Escreve a pergunta aqui..." required />
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <input style={styles.input} type="text" placeholder="Opção A (Resposta Certa)" required /><input style={styles.input} type="text" placeholder="Opção B (Falsa)" required /><input style={styles.input} type="text" placeholder="Opção C (Falsa)" /><input style={styles.input} type="text" placeholder="Opção D (Falsa)" />
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}><button type="submit" style={styles.submitButton}>Guardar Quiz</button></div>
          </form>
        </div>
      )}
    </>
  );
}
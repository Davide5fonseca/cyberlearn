import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function ProfessorAlunos({ theme }) {
  const [viewMode, setViewMode] = useState('list');
  const [alunos, setAlunos] = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [alunoDetalhes, setAlunoDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarAlunos();
  }, []);

  const buscarAlunos = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/professor/alunos');
      if (res.ok) {
        setAlunos(await res.json());
      }
    } catch (err) {
      console.error("Erro a buscar alunos:", err);
    } finally {
      setLoading(false);
    }
  };

  const verDetalhesAluno = async (aluno) => {
    setSelectedAluno(aluno);
    setViewMode('detail');
    setAlunoDetalhes(null); 
    
    try {
      const res = await apiFetch(`/professor/aluno/${aluno.id}/detalhes`);
      if (res.ok) {
        setAlunoDetalhes(await res.json());
      }
    } catch (err) {
      console.error("Erro a buscar detalhes:", err);
    }
  };

  const handleDeleteAluno = async (e, id, nome) => {
    e.stopPropagation(); 
    
    if (window.confirm(`Tem a certeza absoluta que deseja eliminar o(a) aluno(a) ${nome}?\n\nEsta ação é irreversível e apagará todas as notas, XP e troféus associados a esta conta.`)) {
      try {
        const res = await apiFetch(`/utilizadores/${id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          setAlunos(alunos.filter(a => a.id !== id));
          if (selectedAluno && selectedAluno.id === id) setViewMode('list');
        } else {
          alert("Não foi possível eliminar o aluno.");
        }
      } catch (error) {
        console.error("Erro ao eliminar aluno:", error);
      }
    }
  };

  const getRank = (xp) => {
    const xpNum = Number(xp) || 0;
    if (xpNum >= 2500) return { titulo: 'CISO', cor: '#ef4444' }; 
    if (xpNum >= 1200) return { titulo: 'Ethical Hacker', cor: '#8b5cf6' }; 
    if (xpNum >= 600) return { titulo: 'Analista Júnior', cor: '#3b82f6' }; 
    if (xpNum >= 250) return { titulo: 'Explorador', cor: '#10b981' }; 
    return { titulo: 'Script Kiddie', cor: theme.textSub }; 
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px', animation: 'fadeIn 0.4s ease' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}60` },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px', borderBottom: `2px solid ${theme.inputBorder}`, color: theme.textSub, fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' },
    td: { padding: '16px', borderBottom: `1px solid ${theme.inputBorder}40`, color: theme.textMain, fontSize: '14px' },
    tr: { transition: 'background-color 0.2s', cursor: 'pointer' },
    profileHeader: { display: 'flex', gap: '20px', alignItems: 'center', paddingBottom: '24px', borderBottom: `1px solid ${theme.inputBorder}60`, marginBottom: '24px', flexWrap: 'wrap' },
    avatarBig: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: 'bold', boxShadow: `0 4px 15px ${theme.primary}50`, overflow: 'hidden' },
    backBtn: { backgroundColor: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.inputBorder}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', transition: 'all 0.2s' },
    profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' },
    infoBox: { backgroundColor: theme.inputBg, padding: '20px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}40` },
    infoLabel: { fontSize: '11px', color: theme.textSub, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px', display: 'block' },
    infoValue: { fontSize: '14px', color: theme.textMain, fontWeight: '500', margin: 0, lineHeight: '1.5' },
    trophyItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.warning}40`, marginBottom: '10px' },
    quizItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.inputBorder}60`, marginBottom: '12px' },
    buttonSecondary: { backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' },
    socialLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: theme.primary, textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', padding: '6px 12px', backgroundColor: `${theme.primary}15`, borderRadius: '6px', transition: 'background 0.2s' }
  };

  if (viewMode === 'detail' && selectedAluno) {
    const rank = getRank(selectedAluno.xp_total);
    
    return (
      <div style={styles.container}>
        <button 
          style={styles.backBtn} 
          onClick={() => setViewMode('list')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Voltar à Lista de Alunos
        </button>

        <div style={styles.card}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarBig}>
              {selectedAluno.avatar ? <img src={selectedAluno.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : selectedAluno.nome.charAt(0).toUpperCase()}
            </div>
            <div style={{flex: 1, minWidth: '250px'}}>
              <h2 style={{margin: '0 0 5px 0', color: theme.textMain, fontSize: '24px'}}>{selectedAluno.nome}</h2>
              <p style={{margin: '0 0 10px 0', color: theme.textSub, fontSize: '14px'}}>{selectedAluno.email}</p>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
                <span style={{backgroundColor: `${theme.primary}20`, color: theme.primary, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold'}}>
                  {selectedAluno.xp_total || 0} XP
                </span>
                <span style={{backgroundColor: `${rank.cor}20`, color: rank.cor, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'}}>
                  Rank: {rank.titulo}
                </span>
              </div>
            </div>
            
            <button 
              onClick={(e) => handleDeleteAluno(e, selectedAluno.id, selectedAluno.nome)}
              style={{backgroundColor: `${theme.danger}15`, color: theme.danger, border: `1px solid ${theme.danger}50`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Eliminar Aluno
            </button>
          </div>

          {!alunoDetalhes ? (
             <div style={{textAlign: 'center', padding: '40px', color: theme.textSub}}>A carregar o histórico do aluno...</div>
          ) : (
            <div style={styles.profileGrid}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div>
                  <h3 style={{...styles.sectionTitle, marginBottom: '15px'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Perfil e Interesses
                  </h3>
                  <div style={styles.infoBox}>
                    <span style={styles.infoLabel}>Biografia</span>
                    <p style={styles.infoValue}>{alunoDetalhes.biografia || 'O aluno ainda não preencheu a biografia.'}</p>
                    
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${theme.inputBorder}40`}}>
                      <div>
                        <span style={styles.infoLabel}>Nível de Experiência</span>
                        <p style={{...styles.infoValue, textTransform: 'capitalize'}}>{alunoDetalhes.nivel_experiencia || 'Não definido'}</p>
                      </div>
                      <div>
                        <span style={styles.infoLabel}>Área de Maior Interesse</span>
                        <p style={{...styles.infoValue, textTransform: 'capitalize'}}>{alunoDetalhes.area_interesse || 'Não definido'}</p>
                      </div>
                    </div>

                    {(alunoDetalhes.github || alunoDetalhes.linkedin) && (
                      <div style={{marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${theme.inputBorder}40`, display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                        {alunoDetalhes.github && (
                          <a href={alunoDetalhes.github.startsWith('http') ? alunoDetalhes.github : `https://${alunoDetalhes.github}`} target="_blank" rel="noreferrer" style={styles.socialLink} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}30`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}15`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            GitHub
                          </a>
                        )}
                        {alunoDetalhes.linkedin && (
                          <a href={alunoDetalhes.linkedin.startsWith('http') ? alunoDetalhes.linkedin : `https://${alunoDetalhes.linkedin}`} target="_blank" rel="noreferrer" style={styles.socialLink} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}30`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}15`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            LinkedIn
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{...styles.sectionTitle, marginBottom: '15px'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.warning} strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                    Vitrina de Troféus ({alunoDetalhes.trofeus.length})
                  </h3>
                  <div style={{backgroundColor: theme.inputBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}40`, maxHeight: '250px', overflowY: 'auto'}}>
                    {alunoDetalhes.trofeus.length === 0 ? (
                      <p style={{color: theme.textSub, fontSize: '13px', margin: 0, textAlign: 'center', padding: '20px 0'}}>Nenhum troféu conquistado.</p>
                    ) : (
                      alunoDetalhes.trofeus.map((t, i) => (
                        <div key={i} style={styles.trophyItem}>
                          <span style={{fontSize: '24px'}}>{t.icone}</span>
                          <div>
                            <p style={{margin: '0 0 2px 0', color: theme.textMain, fontWeight: 'bold', fontSize: '14px'}}>{t.nome}</p>
                            <p style={{margin: 0, color: theme.textSub, fontSize: '11px'}}>{t.data}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{...styles.sectionTitle, marginBottom: '15px'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  Histórico de Avaliações ({alunoDetalhes.quizzes.length})
                </h3>
                <div style={{backgroundColor: theme.inputBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}40`, maxHeight: '600px', overflowY: 'auto'}}>
                   {alunoDetalhes.quizzes.length === 0 ? (
                      <div style={{textAlign: 'center', padding: '30px', color: theme.textSub}}>
                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom: '10px'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                         <p style={{margin: 0, fontSize: '13px'}}>Este aluno ainda não realizou nenhum quiz.</p>
                      </div>
                   ) : (
                      alunoDetalhes.quizzes.map((q, i) => {
                        const percentagem = Math.round((q.acertos / q.total_perguntas) * 100);
                        const aprovado = percentagem >= 50;
                        return (
                          <div key={i} style={styles.quizItem}>
                            <div style={{flex: 1}}>
                              <p style={{margin: '0 0 4px 0', color: theme.textMain, fontWeight: 'bold', fontSize: '14px'}}>{q.quiz_titulo}</p>
                              <p style={{margin: 0, color: theme.textSub, fontSize: '11px'}}>Realizado a {q.data}</p>
                            </div>
                            <div style={{textAlign: 'right'}}>
                              <p style={{margin: 0, color: aprovado ? theme.success : theme.danger, fontWeight: '900', fontSize: '18px'}}>{percentagem}%</p>
                              <p style={{margin: 0, color: theme.textSub, fontSize: '10px'}}>{q.acertos} / {q.total_perguntas} corretas</p>
                            </div>
                          </div>
                        );
                      })
                   )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Turma de Cibersegurança
          </h2>

          <button 
            onClick={() => { buscarAlunos(); alert("Aviso: Dados da turma atualizados."); }}
            style={styles.buttonSecondary}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Atualizar Dados
          </button>
        </div>
        
        {loading ? (
           <p style={{color: theme.textSub, textAlign: 'center', padding: '20px'}}>A carregar alunos...</p>
        ) : alunos.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', border: `1px dashed ${theme.inputBorder}`, borderRadius: '8px', backgroundColor: theme.inputBg}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5" style={{marginBottom: '10px'}}><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
            <p style={{color: theme.textSub, margin: 0, fontWeight: 'bold', fontSize: '13px'}}>Ainda não existem alunos registados.</p>
          </div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Aluno</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Pontuação XP</th>
                  <th style={styles.th}>Rank Global</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map(aluno => {
                  const rank = getRank(aluno.xp_total);
                  return (
                    <tr 
                      key={aluno.id} 
                      style={styles.tr} 
                      onClick={() => verDetalhesAluno(aluno)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}10`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={styles.td}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '12px', overflow: 'hidden'}}>
                            {aluno.avatar ? <img src={aluno.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : aluno.nome.charAt(0).toUpperCase()}
                          </div>
                          <span style={{fontWeight: 'bold'}}>{aluno.nome}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{aluno.email}</td>
                      <td style={{...styles.td, fontWeight: 'bold', color: theme.primary}}>{aluno.xp_total || 0} XP</td>
                      <td style={styles.td}>
                        <span style={{backgroundColor: `${rank.cor}20`, color: rank.cor, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'}}>
                          {rank.titulo}
                        </span>
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                          <button style={{backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'}}>
                            Ver Perfil
                          </button>
                          
                          <button 
                            onClick={(e) => handleDeleteAluno(e, aluno.id, aluno.nome)}
                            style={{backgroundColor: `${theme.danger}15`, color: theme.danger, border: `1px solid ${theme.danger}40`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'background-color 0.2s'}}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}30`}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
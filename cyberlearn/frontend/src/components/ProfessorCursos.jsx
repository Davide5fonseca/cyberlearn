import { useState, useEffect } from 'react';

export default function ProfessorCursos({ theme, user }) {
  const [activeTab, setActiveTab] = useState('gerirCursos'); 
  
  const [cursosReais, setCursosReais] = useState([]); 
  const [cursoData, setCursoData] = useState({ titulo: '', nivel: 'iniciante', descricao: '', conteudo_licao: '' });
  
  // MUDANÇA: O estado agora guarda o "nome_curso" que tu escreves, em vez do ID diretamente
  const [quizData, setQuizData] = useState({ titulo: '', nome_curso: '', pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 'A' });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarCursos();
  }, [activeTab]);

  const buscarCursos = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/cursos');
      if (res.ok) setCursosReais(await res.json());
    } catch (err) { 
      console.error("Erro ao buscar cursos:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeleteCurso = async (cursoId) => {
    if (!window.confirm("Tens a certeza que queres APAGAR este curso para sempre? Esta ação não pode ser desfeita!")) return; 
    
    try {
      const response = await fetch(`http://localhost:8080/cursos/${cursoId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        alert("✅ " + data.mensagem);
        setCursosReais(cursosReais.filter(curso => curso.id !== cursoId)); 
      } else {
        alert("Erro: " + data.erro);
      }
    } catch (error) {
      alert("Erro de ligação ao servidor.");
    }
  };

  const handleCursoChange = (e) => setCursoData({ ...cursoData, [e.target.name]: e.target.value });
  const handleQuizChange = (e) => setQuizData({ ...quizData, [e.target.name]: e.target.value });

  const handleSubmitCurso = async (e) => { 
    e.preventDefault(); 
    try {
      const res = await fetch('http://localhost:8080/cursos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cursoData, professor_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + data.mensagem);
        setCursoData({ titulo: '', nivel: 'iniciante', descricao: '', conteudo_licao: '' }); 
        setActiveTab('gerirCursos'); 
      } else alert("Erro: " + data.erro);
    } catch (err) { alert("Erro de ligação ao servidor."); }
  };

  const handleSubmitQuiz = async (e) => { 
    e.preventDefault(); 
    
    // MUDANÇA: Procura na lista o ID do curso através do nome que escreveste
    const cursoEncontrado = cursosReais.find(c => c.titulo.toLowerCase().trim() === quizData.nome_curso.toLowerCase().trim());
    
    if (!cursoEncontrado) {
        alert("Erro: O curso que escreveste não foi encontrado. Garante que o nome está igual ao que criaste!");
        return;
    }

    const dadosParaEnviar = { ...quizData, curso_id: cursoEncontrado.id };

    try {
      const res = await fetch('http://localhost:8080/quizzes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaEnviar)
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + data.mensagem);
        setQuizData({ titulo: '', nome_curso: '', pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 'A' });
      } else alert("Erro: " + data.erro);
    } catch (err) { alert("Erro de ligação ao servidor."); }
  };

  // ==========================================
  // ESTILOS VISUAIS (TAMANHOS REDUZIDOS / COMPACTOS)
  // ==========================================
  const styles = {
    tabsContainer: { display: 'inline-flex', gap: '4px', marginBottom: '20px', backgroundColor: theme.inputBg, padding: '6px', borderRadius: '10px', boxShadow: `inset 0 2px 4px rgba(0,0,0,0.1)` },
    tabButton: (isActive) => ({ backgroundColor: isActive ? theme.primary : 'transparent', color: isActive ? 'white' : theme.textSub, border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: isActive ? 'bold' : '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: isActive ? `0 4px 8px ${theme.primary}50` : 'none' }),
    
    // Cards mais compactos
    card: { backgroundColor: theme.cardBg, borderRadius: '12px', padding: '20px 25px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}40` },
    sectionTitle: { fontSize: '18px', color: theme.textMain, marginBottom: '6px', marginTop: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    
    // Tabelas mais estreitas
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: theme.textMain, fontSize: '13px' },
    th: { padding: '12px', borderBottom: `2px solid ${theme.inputBorder}`, color: theme.textSub, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' },
    td: { padding: '12px', borderBottom: `1px solid ${theme.inputBorder}60`, verticalAlign: 'middle' },
    
    // Formulários reduzidos
    inputWrapper: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '11px', color: theme.textSub, fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' },
    input: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '10px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit' },
    textarea: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '10px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', minHeight: '70px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' },
    
    // Botões
    submitButton: { backgroundColor: theme.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.1s, opacity 0.2s', boxShadow: `0 4px 10px ${theme.primary}50` },
    deleteButton: { backgroundColor: `${theme.danger}15`, color: theme.danger, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s' },
    
    levelBadge: (nivel) => {
      const n = String(nivel || 'iniciante').toLowerCase();
      return { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: n === 'iniciante' ? `${theme.success}20` : n === 'avancado' ? `${theme.danger}20` : `${theme.warning}20`, color: n === 'iniciante' ? theme.success : n === 'avancado' ? theme.danger : theme.warning };
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: theme.primary, padding: '8px', borderRadius: '8px', color: 'white', boxShadow: `0 4px 10px ${theme.primary}50` }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <h1 style={{ color: theme.textMain, margin: 0, fontSize: '22px' }}>Gestão de Conteúdos</h1>
      </div>

      <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' }}>
        <div style={styles.tabsContainer}>
          <button style={styles.tabButton(activeTab === 'gerirCursos')} onClick={() => setActiveTab('gerirCursos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> 
            Cursos Publicados
          </button>
          <button style={styles.tabButton(activeTab === 'createCourse')} onClick={() => setActiveTab('createCourse')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Novo Curso
          </button>
          <button style={styles.tabButton(activeTab === 'createQuiz')} onClick={() => setActiveTab('createQuiz')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Novo Quiz
          </button>
        </div>
      </div>

      {activeTab === 'gerirCursos' && (
        <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
            <div>
              <h2 style={styles.sectionTitle}>Os Teus Cursos Publicados</h2>
              <p style={{color: theme.textSub, fontSize: '13px', margin: 0}}>Visão geral dos conteúdos disponibilizados aos alunos.</p>
            </div>
            <button 
              style={styles.submitButton} 
              onClick={() => setActiveTab('createCourse')}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
               + Adicionar Curso
            </button>
          </div>
          
          {loading ? (
            <div style={{textAlign: 'center', padding: '30px 0'}}>
              <p style={{color: theme.textSub, fontSize: '14px'}}>A carregar dados...</p>
            </div>
          ) : cursosReais.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px 20px', border: `2px dashed ${theme.inputBorder}`, borderRadius: '12px', backgroundColor: theme.inputBg}}>
               <div style={{ backgroundColor: theme.cardBg, width: '48px', height: '48px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 10px auto', boxShadow: theme.shadow }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
               </div>
               <h3 style={{color: theme.textMain, margin: '0 0 5px 0', fontSize: '16px'}}>Ainda não tens cursos</h3>
               <p style={{color: theme.textSub, margin: 0, fontSize: '13px'}}>Começa a partilhar conhecimento criando o teu primeiro curso.</p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Título do Curso</th>
                    <th style={styles.th}>Dificuldade</th>
                    <th style={styles.th} styles={{...styles.th, textAlign: 'right'}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosReais.map(curso => (
                    <tr key={curso.id} style={{transition: 'background-color 0.2s', ':hover': { backgroundColor: theme.inputBg }}}>
                      <td style={{...styles.td, fontWeight: 'bold'}}>{curso.titulo}</td>
                      <td style={styles.td}>
                        <span style={styles.levelBadge(curso.nivel)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                          {curso.nivel || 'Iniciante'}
                        </span>
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button 
                          style={{...styles.deleteButton, marginLeft: 'auto'}} 
                          onClick={() => handleDeleteCurso(curso.id)}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.danger; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = `${theme.danger}15`; e.currentTarget.style.color = theme.danger; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> 
                          Apagar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'createCourse' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Construir Novo Curso
          </h2>
          <p style={{color: theme.textSub, fontSize: '13px', marginBottom: '20px'}}>Preenche os detalhes abaixo para lançar um novo módulo.</p>
          
          <form onSubmit={handleSubmitCurso}>
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
              <div style={{...styles.inputWrapper, flex: '1 1 250px'}}>
                <label style={styles.label}>Título do Curso</label>
                <input style={styles.input} type="text" name="titulo" value={cursoData.titulo} onChange={handleCursoChange} placeholder="Ex: Fundamentos de Cibersegurança" required />
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 150px'}}>
                <label style={styles.label}>Nível de Dificuldade</label>
                <select style={styles.input} name="nivel" value={cursoData.nivel} onChange={handleCursoChange}>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermedio">Intermédio</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
            </div>
            
            <div style={{backgroundColor: theme.inputBg, padding: '15px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}60`, marginBottom: '20px'}}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Descrição Rápida (Catálogo)</label>
                <textarea style={styles.textarea} name="descricao" value={cursoData.descricao} onChange={handleCursoChange} placeholder="Escreve um pequeno resumo que cative os alunos..." required></textarea>
              </div>
              <div style={{...styles.inputWrapper, marginBottom: 0}}>
                <label style={styles.label}>Conteúdo da Primeira Lição (Opcional)</label>
                <textarea style={styles.textarea} name="conteudo_licao" value={cursoData.conteudo_licao} onChange={handleCursoChange} placeholder="Cola aqui a teoria, explicações e comandos..."></textarea>
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit" style={styles.submitButton} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Publicar Curso
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'createQuiz' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.warning} strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Criar Avaliação
          </h2>
          <p style={{color: theme.textSub, fontSize: '13px', marginBottom: '20px'}}>Gera um teste para avaliar os conhecimentos dos alunos.</p>

          <form onSubmit={handleSubmitQuiz}>
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', backgroundColor: theme.inputBg, padding: '15px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}60`, marginBottom: '20px'}}>
              <div style={{...styles.inputWrapper, flex: '1 1 250px', marginBottom: 0}}>
                <label style={styles.label}>Título do Quiz</label>
                <input style={styles.input} type="text" name="titulo" value={quizData.titulo} onChange={handleQuizChange} placeholder="Ex: Avaliação Final de Redes" required />
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 200px', marginBottom: 0}}>
                <label style={styles.label}>Escreve o Nome do Curso Associado</label>
                {/* MUDANÇA AQUI: Input de texto livre com DataList para ajuda */}
                <input style={styles.input} type="text" list="cursos-list" name="nome_curso" value={quizData.nome_curso} onChange={handleQuizChange} placeholder="Ex: Introdução ao Phishing" required autoComplete="off" />
                <datalist id="cursos-list">
                  {cursosReais.map(curso => (
                    <option key={curso.id} value={curso.titulo} />
                  ))}
                </datalist>
              </div>
            </div>
            
            <div style={{ padding: '15px', borderRadius: '10px', border: `2px dashed ${theme.primary}50`, marginBottom: '20px'}}>
              <h4 style={{color: theme.primary, margin: '0 0 15px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                <div style={{backgroundColor: theme.primary, color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px'}}>1</div>
                Estrutura da Pergunta
              </h4>
              
              <input style={{...styles.input, marginBottom: '15px'}} type="text" name="pergunta" value={quizData.pergunta} onChange={handleQuizChange} placeholder="Ex: Qual destas opções é um ataque de Phishing?" required />
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
                <div style={{position: 'relative'}}>
                  <span style={{position: 'absolute', top: '11px', left: '12px', fontWeight: 'bold', color: theme.textSub, fontSize: '13px'}}>A.</span>
                  <input style={{...styles.input, paddingLeft: '32px'}} type="text" name="opcao_a" value={quizData.opcao_a} onChange={handleQuizChange} placeholder="Opção A" required />
                </div>
                <div style={{position: 'relative'}}>
                  <span style={{position: 'absolute', top: '11px', left: '12px', fontWeight: 'bold', color: theme.textSub, fontSize: '13px'}}>B.</span>
                  <input style={{...styles.input, paddingLeft: '32px'}} type="text" name="opcao_b" value={quizData.opcao_b} onChange={handleQuizChange} placeholder="Opção B" required />
                </div>
                <div style={{position: 'relative'}}>
                  <span style={{position: 'absolute', top: '11px', left: '12px', fontWeight: 'bold', color: theme.textSub, fontSize: '13px'}}>C.</span>
                  <input style={{...styles.input, paddingLeft: '32px'}} type="text" name="opcao_c" value={quizData.opcao_c} onChange={handleQuizChange} placeholder="Opção C (Opcional)" />
                </div>
                <div style={{position: 'relative'}}>
                  <span style={{position: 'absolute', top: '11px', left: '12px', fontWeight: 'bold', color: theme.textSub, fontSize: '13px'}}>D.</span>
                  <input style={{...styles.input, paddingLeft: '32px'}} type="text" name="opcao_d" value={quizData.opcao_d} onChange={handleQuizChange} placeholder="Opção D (Opcional)" />
                </div>
              </div>

              <div style={{marginTop: '15px', padding: '10px 15px', backgroundColor: `${theme.primary}15`, borderRadius: '8px', display: 'inline-block'}}>
                <label style={{...styles.label, display: 'inline', marginRight: '10px', color: theme.primary}}>Opção Certa:</label>
                <select style={{...styles.input, width: 'auto', padding: '6px 12px', display: 'inline-block', borderColor: theme.primary, color: theme.textMain, fontWeight: 'bold'}} name="resposta_correta" value={quizData.resposta_correta} onChange={handleQuizChange} required>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit" style={styles.submitButton} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                Guardar Avaliação na BD
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
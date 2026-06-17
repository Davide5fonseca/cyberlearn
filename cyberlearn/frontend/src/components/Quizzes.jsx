import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useUI } from './ui/UIProvider';

export default function Quizzes({ theme, setView, user, targetQuizCourse, setTargetQuizCourse }) {
  const { notify, confirm } = useUI();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    buscarQuizzes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscarQuizzes = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/quizzes');
      if (response.ok) {
        const data = await response.json();
        
        const groupedQuizzes = {};
        
        data.forEach(row => {
          if (!groupedQuizzes[row.titulo]) {
            groupedQuizzes[row.titulo] = {
              id: row.id,
              titulo: row.titulo,
              nome_curso: row.nome_curso,
              nivel_curso: row.nivel_curso,
              perguntas: []
            };
          }
          
          const opcoes = [row.opcao_a, row.opcao_b];
          if (row.opcao_c && row.opcao_c.trim() !== '') opcoes.push(row.opcao_c);
          if (row.opcao_d && row.opcao_d.trim() !== '') opcoes.push(row.opcao_d);

          const mapResposta = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

          groupedQuizzes[row.titulo].perguntas.push({
            pergunta: row.pergunta,
            opcoes: opcoes,
            respostaCerta: mapResposta[row.resposta_correta]
          });
        });

        const arrayQuizzes = Object.values(groupedQuizzes);
        setQuizzes(arrayQuizzes);

        // --- LÓGICA DE ABERTURA AUTOMÁTICA ---
        if (targetQuizCourse) {
          // Procuramos se existe um quiz cujo nome do curso seja o do curso que o utilizador acabou
          const quizAlvo = arrayQuizzes.find(q => q.nome_curso === targetQuizCourse);
          
          if (quizAlvo) {
            if (quizAlvo.perguntas.length > 0) {
              setActiveQuiz(quizAlvo);
              setCurrentQuestion(0);
              setScore(0);
              setShowResults(false);
              setSelectedOption(null);
            } else {
              notify("Este quiz ainda não tem perguntas disponíveis!", 'warning');
            }
          } else {
            notify(`Ainda não existe um quiz associado ao curso "${targetQuizCourse}".`, 'info');
          }
          // Limpamos o alvo para não forçar a abertura noutras visitas à página
          if (setTargetQuizCourse) setTargetQuizCourse(null);
        }
        // ---------------------------------------

      }
    } catch (error) {
      console.error("Erro ao carregar quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quiz) => {
    if (quiz.perguntas.length === 0) {
      notify("Este quiz ainda não tem perguntas disponíveis!", 'warning');
      return;
    }
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setSelectedOption(null);
  };

  const handleAnswer = async () => {
    let novaPontuacao = score;

    if (selectedOption === activeQuiz.perguntas[currentQuestion].respostaCerta) {
      novaPontuacao = score + 1;
      setScore(novaPontuacao);
    }
    
    if (currentQuestion + 1 < activeQuiz.perguntas.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      setShowResults(true);

      if (user?.id) {
        const totalPerguntas = activeQuiz.perguntas.length;
        const percentagem = (novaPontuacao / totalPerguntas) * 100;
        
        let xpGanho = 10; 
        if (percentagem === 100) xpGanho = 100;
        else if (percentagem >= 80) xpGanho = 75;
        else if (percentagem >= 50) xpGanho = 50;

        try {
          await apiFetch('/quizzes/salvar-resultado', {
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               utilizadorId: user.id, 
               quizTitulo: activeQuiz.titulo, 
               acertos: novaPontuacao, 
               totalPerguntas: totalPerguntas 
             })
          });

          await apiFetch('/xp/adicionar', {
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ utilizadorId: user.id, quantidade: xpGanho })
          });

          await apiFetch('/conquistas/atribuir', {
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ utilizadorId: user.id, nomeConquista: 'Primeiro Sangue' })
          });

          if (percentagem >= 50) {
            await apiFetch('/conquistas/atribuir', {
               method: 'POST', headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ utilizadorId: user.id, nomeConquista: 'Escudo Ativo' })
            });

            if (percentagem === 100) {
                await apiFetch('/conquistas/atribuir', {
                   method: 'POST', headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ utilizadorId: user.id, nomeConquista: 'Hacker Perfeito' })
                });
            }
          }
        } catch (error) {
          console.error("Erro ao atribuir troféus/XP:", error);
        }
      }
    }
  };

  const getBaseColor = (nivel) => {
    const n = String(nivel || 'iniciante').toLowerCase();
    if (n === 'avancado') return '#ef4444'; 
    if (n === 'intermedio') return '#f59e0b'; 
    return '#3b82f6'; 
  };

  const getGradient = (nivel) => {
    const n = String(nivel || 'iniciante').toLowerCase();
    if (n === 'avancado') return 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)';
    if (n === 'intermedio') return 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
    return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
  };

  const styles = {
    container: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', animation: 'fadeIn 0.4s ease' },
    centeredWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', width: '100%' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
    
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}40`, display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', cursor: activeQuiz ? 'default' : 'pointer', height: '100%' },
    
    imagePlaceholder: (nivel) => ({ 
      height: '140px', 
      background: getGradient(nivel), 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      color: 'rgba(255,255,255,0.8)', 
      position: 'relative'
    }),
    badgeNivelAbsoluto: (nivel) => {
      const cor = getBaseColor(nivel);
      return { position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: cor, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', border: `1px solid ${cor}50` };
    },
    
    cardBody: { padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 },
    title: { fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 12px 0', lineHeight: '1.4' },
    metaRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '16px', flexWrap: 'wrap' },
    metaItem: { fontSize: '12px', color: theme.textSub, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', backgroundColor: theme.inputBg, padding: '4px 8px', borderRadius: '6px' },
    
    button: (nivel) => {
      const cor = getBaseColor(nivel);
      return { width: '100%', padding: '14px', backgroundColor: cor, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 12px ${cor}40`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: 'auto' };
    },
    
    quizActiveCard: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '40px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, maxWidth: '800px', margin: '0 auto', width: '100%' },
    resultCard: { backgroundColor: theme.cardBg, borderRadius: '24px', padding: '60px 40px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'fadeInUp 0.5s ease' },

    optionBtn: (isSelected, activeColor) => ({
      width: '100%', padding: '18px 20px', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', marginBottom: '12px', fontSize: '15px', transition: 'all 0.2s ease', fontWeight: isSelected ? 'bold' : 'normal',
      backgroundColor: isSelected ? `${activeColor}15` : theme.inputBg,
      border: `2px solid ${isSelected ? activeColor : theme.inputBorder}`,
      color: theme.textMain, display: 'flex', gap: '15px', alignItems: 'center'
    }),
    
    progressContainer: { width: '100%', height: '8px', backgroundColor: theme.inputBg, borderRadius: '4px', overflow: 'hidden', marginTop: '10px' },
    progressBar: (percent, activeColor) => ({ width: `${percent}%`, height: '100%', backgroundColor: activeColor, transition: 'width 0.3s ease' })
  };

  if (showResults) {
    const passed = score >= activeQuiz.perguntas.length / 2;
    return (
      <div style={styles.centeredWrapper}>
        <div style={styles.resultCard}>
          <div style={{width: '110px', height: '110px', borderRadius: '50%', backgroundColor: passed ? `${theme.success}20` : `${theme.danger}20`, color: passed ? theme.success : theme.danger, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px'}}>
            {passed ? 
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : 
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            }
          </div>
          
          <h2 style={{color: theme.textMain, margin: '0 0 10px 0', fontSize: '32px', fontWeight: '900'}}>
            Quiz Terminado!
          </h2>
          
          <p style={{color: theme.textSub, fontSize: '18px', margin: '0 0 30px 0'}}>
            Respondeste corretamente a <strong style={{color: theme.primary, fontSize: '24px'}}>{score}</strong> de {activeQuiz.perguntas.length} questões.
          </p>
          
          <div style={{
              width: '100%', padding: '25px', backgroundColor: passed ? `${theme.success}10` : `${theme.danger}10`, 
              border: `1px solid ${passed ? theme.success : theme.danger}30`, borderRadius: '16px', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '40px'
          }}>
            <span style={{fontSize: '32px'}}>{passed ? '🏆' : '📚'}</span>
            <span style={{color: passed ? theme.success : theme.danger, fontWeight: '800', fontSize: '18px'}}>
              {passed ? 'Parabéns! Foste aprovado neste módulo.' : 'Não atingiste a pontuação mínima necessária.'}
            </span>
            <span style={{fontSize: '14px', color: theme.textSub, fontWeight: '500'}}>
              {passed ? 'O teu progresso foi guardado na tua vitrina.' : 'Garantiste 10 XP de consolação. Revê o material e tenta novamente.'}
            </span>
          </div>
          
          <button 
             style={{...styles.button('iniciante'), width: 'auto', padding: '16px 50px', backgroundColor: theme.primary, backgroundImage: theme.gradient, boxShadow: `0 8px 20px ${theme.primary}45`, fontSize: '16px'}}
             onClick={() => setView('dashboard')}
             onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
             onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (activeQuiz) {
    const currentQData = activeQuiz.perguntas[currentQuestion];
    const progressPercent = ((currentQuestion + 1) / activeQuiz.perguntas.length) * 100;
    const activeColor = getBaseColor(activeQuiz.nivel_curso); 

    return (
      <div style={styles.container}>
        <div style={styles.quizActiveCard}>
          
          <div style={{marginBottom: '30px', paddingBottom: '20px', borderBottom: `1px solid ${theme.inputBorder}`}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
              <span style={{color: theme.textSub, fontSize: '14px', fontWeight: 'bold'}}>
                 Questão <span style={{color: activeColor, fontSize: '18px'}}>{currentQuestion + 1}</span> de {activeQuiz.perguntas.length}
              </span>
              <span style={{color: theme.danger, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '6px 12px', backgroundColor: `${theme.danger}15`, borderRadius: '6px', transition: 'background 0.2s'}} onClick={async () => { if (await confirm({ title: 'Abandonar quiz', message: 'Queres mesmo sair? O teu progresso será perdido.', confirmLabel: 'Abandonar', danger: true })) setActiveQuiz(null); }}>Abandonar</span>
            </div>
            <div style={styles.progressContainer}>
              <div style={styles.progressBar(progressPercent, activeColor)}></div>
            </div>
          </div>
          
          <h2 style={{color: theme.textMain, fontSize: '22px', marginBottom: '35px', lineHeight: '1.5', fontWeight: 'bold'}}>
            {currentQData.pergunta}
          </h2>

          <div style={{marginBottom: '40px'}}>
            {currentQData.opcoes.map((opcao, index) => (
              <button 
                key={index} 
                style={styles.optionBtn(selectedOption === index, activeColor)}
                onClick={() => setSelectedOption(index)}
                onMouseEnter={(e) => { if(selectedOption !== index) e.currentTarget.style.borderColor = activeColor }}
                onMouseLeave={(e) => { if(selectedOption !== index) e.currentTarget.style.borderColor = theme.inputBorder }}
              >
                <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: selectedOption === index ? activeColor : theme.inputBorder, color: selectedOption === index ? 'white' : theme.textSub, fontWeight: 'bold', fontSize: '13px' }}>
                  {String.fromCharCode(65 + index)}
                </span>
                {opcao}
              </button>
            ))}
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${theme.inputBorder}`, paddingTop: '25px'}}>
            <button 
              style={{...styles.button(activeQuiz.nivel_curso), width: 'auto', padding: '14px 40px', opacity: selectedOption === null ? 0.5 : 1, cursor: selectedOption === null ? 'not-allowed' : 'pointer', boxShadow: selectedOption === null ? 'none' : `0 4px 12px ${activeColor}40`}} 
              disabled={selectedOption === null}
              onClick={handleAnswer}
              onMouseEnter={(e) => { if(selectedOption !== null) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.filter = 'brightness(1.1)'; } }}
              onMouseLeave={(e) => { if(selectedOption !== null) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; } }}
            >
              {currentQuestion + 1 === activeQuiz.perguntas.length ? 'Finalizar Avaliação' : 'Confirmar e Avançar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {loading ? (
        <div style={{textAlign: 'center', padding: '60px', color: theme.textSub, fontWeight: 'bold'}}>
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginBottom: '15px', animation: 'spin 2s linear infinite'}}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
           <br/>A sincronizar as avaliações...
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{textAlign: 'center', padding: '80px 20px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `2px dashed ${theme.inputBorder}`}}>
          <div style={{ backgroundColor: theme.inputBg, width: '70px', height: '70px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto', color: theme.textSub }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 style={{color: theme.textMain, margin: '0 0 10px 0', fontSize: '18px'}}>Nenhuma avaliação disponível</h3>
          <p style={{color: theme.textSub, fontSize: '14px', margin: 0}}>Os professores ainda não lançaram desafios na plataforma.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {quizzes.map((quiz) => (
            <div 
              key={quiz.id} 
              style={styles.card} 
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.2)`; }} 
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow; }}
            >
              <div style={styles.imagePlaceholder(quiz.nivel_curso)}>
                <span style={styles.badgeNivelAbsoluto(quiz.nivel_curso)}>Módulo Final</span>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="9 15 11 17 15 11"></polyline></svg>
              </div>
              
              <div style={styles.cardBody}>
                <h4 style={styles.title}>{quiz.titulo}</h4>
                
                <div style={styles.metaRow}>
                  <span style={styles.metaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                    {quiz.nome_curso || 'Curso Geral'}
                  </span>
                  <span style={styles.metaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {quiz.perguntas.length} Questões
                  </span>
                </div>
                
                <button 
                  style={styles.button(quiz.nivel_curso)} 
                  onClick={() => handleStartQuiz(quiz)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  Iniciar Quiz
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
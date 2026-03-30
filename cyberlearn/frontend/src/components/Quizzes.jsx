/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Quizzes({ theme }) {
  // Estado de Dados da API
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado do Jogo (O teu código original)
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    buscarQuizzes();
  }, []);

  const buscarQuizzes = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/quizzes');
      if (response.ok) {
        const data = await response.json();
        
        // MAGIA AQUI: Agrupar as perguntas que vêm da BD por "Título do Quiz"
        const groupedQuizzes = {};
        
        data.forEach(row => {
          if (!groupedQuizzes[row.titulo]) {
            groupedQuizzes[row.titulo] = {
              id: row.id,
              titulo: row.titulo,
              nome_curso: row.nome_curso,
              perguntas: []
            };
          }
          
          // Limpar opções vazias (caso o prof não tenha preenchido C e D)
          const opcoes = [row.opcao_a, row.opcao_b];
          if (row.opcao_c && row.opcao_c.trim() !== '') opcoes.push(row.opcao_c);
          if (row.opcao_d && row.opcao_d.trim() !== '') opcoes.push(row.opcao_d);

          // Converter a letra da BD ('A', 'B', 'C', 'D') num número (0, 1, 2, 3) para bater certo com a tua lógica
          const mapResposta = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

          groupedQuizzes[row.titulo].perguntas.push({
            pergunta: row.pergunta,
            opcoes: opcoes,
            respostaCerta: mapResposta[row.resposta_correta]
          });
        });

        // Converte o objeto de volta para um Array
        setCursosFormatados(Object.values(groupedQuizzes));
      }
    } catch (error) {
      console.error("Erro ao carregar quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const setCursosFormatados = (dados) => {
    setQuizzes(dados);
  };

  const handleStartQuiz = (quiz) => {
    if (quiz.perguntas.length === 0) {
      alert("Este quiz ainda não tem perguntas disponíveis!");
      return;
    }
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setSelectedOption(null);
  };

  const handleAnswer = () => {
    if (selectedOption === activeQuiz.perguntas[currentQuestion].respostaCerta) {
      setScore(score + 1);
    }
    
    if (currentQuestion + 1 < activeQuiz.perguntas.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      setShowResults(true);
    }
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px', animation: 'fadeIn 0.4s ease' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, padding: '24px', borderRadius: '16px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    pageTitle: { color: theme.textMain, fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '30px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: activeQuiz ? 'default' : 'pointer' },
    
    title: { fontSize: '20px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 10px 0' },
    desc: { fontSize: '14px', color: theme.primary, margin: '0 0 20px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' },
    badge: { padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: '15px', backgroundColor: `${theme.warning}20`, color: theme.warning },
    button: { width: '100%', backgroundColor: theme.warning, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto', transition: 'all 0.2s', boxShadow: `0 4px 10px ${theme.warning}40` },
    
    // Estilos da área de perguntas
    optionBtn: (isSelected) => ({
      width: '100%', padding: '18px 20px', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', marginBottom: '12px', fontSize: '15px', transition: 'all 0.2s ease', fontWeight: isSelected ? 'bold' : 'normal',
      backgroundColor: isSelected ? `${theme.primary}20` : theme.inputBg,
      border: `2px solid ${isSelected ? theme.primary : theme.inputBorder}`,
      color: theme.textMain
    }),
    progressText: { color: theme.textSub, fontSize: '14px', fontWeight: 'bold', display: 'block' }
  };

  // ==========================================
  // VISTA 3: RESULTADOS DO QUIZ
  // ==========================================
  if (showResults) {
    const passed = score >= activeQuiz.perguntas.length / 2;
    return (
      <div style={styles.container}>
        <div style={{...styles.card, alignItems: 'center', textAlign: 'center', padding: '60px 40px', maxWidth: '600px', margin: '0 auto', width: '100%'}}>
          <div style={{width: '90px', height: '90px', borderRadius: '50%', backgroundColor: passed ? `${theme.success}20` : `${theme.danger}20`, color: passed ? theme.success : theme.danger, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px'}}>
            {passed ? 
              <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : 
              <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            }
          </div>
          <h2 style={{color: theme.textMain, margin: '0 0 10px 0', fontSize: '28px'}}>Quiz Terminado!</h2>
          <p style={{color: theme.textSub, fontSize: '18px', margin: '0 0 20px 0'}}>Acertaste em <strong style={{color: theme.primary}}>{score}</strong> de {activeQuiz.perguntas.length} perguntas.</p>
          
          {passed ? 
            <p style={{color: theme.success, fontWeight: 'bold', fontSize: '16px', padding: '15px', backgroundColor: `${theme.success}10`, borderRadius: '10px', width: '100%'}}>Parabéns! Módulo aprovado. +100 XP 🏆</p> : 
            <p style={{color: theme.danger, fontWeight: 'bold', fontSize: '16px', padding: '15px', backgroundColor: `${theme.danger}10`, borderRadius: '10px', width: '100%'}}>Não atingiste a nota mínima. Volta a estudar o conteúdo e tenta novamente! 📚</p>
          }
          
          <button style={{...styles.button, width: 'auto', padding: '14px 40px', marginTop: '30px', backgroundColor: theme.inputBg, color: theme.textMain, boxShadow: 'none', border: `2px solid ${theme.inputBorder}`}} onClick={() => setActiveQuiz(null)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}>
            Voltar ao Catálogo de Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: A RESPONDER AO QUIZ
  // ==========================================
  if (activeQuiz) {
    const currentQData = activeQuiz.perguntas[currentQuestion];
    return (
      <div style={styles.container}>
        <div style={{...styles.card, maxWidth: '800px', margin: '0 auto', width: '100%'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: `1px solid ${theme.inputBorder}`}}>
            <span style={styles.progressText}>
               <span style={{color: theme.primary, fontSize: '18px'}}>{currentQuestion + 1}</span> / {activeQuiz.perguntas.length}
            </span>
            <span style={{color: theme.danger, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: '6px 12px', backgroundColor: `${theme.danger}15`, borderRadius: '6px'}} onClick={() => { if(window.confirm('Queres mesmo sair? O teu progresso será perdido.')) setActiveQuiz(null) }}>Abandonar Quiz</span>
          </div>
          
          <h2 style={{color: theme.textMain, fontSize: '22px', marginBottom: '30px', lineHeight: '1.5'}}>
            {currentQData.pergunta}
          </h2>

          <div style={{marginBottom: '30px'}}>
            {currentQData.opcoes.map((opcao, index) => (
              <button 
                key={index} 
                style={styles.optionBtn(selectedOption === index)}
                onClick={() => setSelectedOption(index)}
              >
                <span style={{ display: 'inline-block', width: '30px', fontWeight: 'bold', color: selectedOption === index ? theme.primary : theme.textSub }}>
                  {String.fromCharCode(65 + index)}.
                </span>
                {opcao}
              </button>
            ))}
          </div>

          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <button 
              style={{...styles.button, width: 'auto', padding: '14px 40px', backgroundColor: theme.primary, opacity: selectedOption === null ? 0.5 : 1, cursor: selectedOption === null ? 'not-allowed' : 'pointer', boxShadow: selectedOption === null ? 'none' : `0 4px 12px ${theme.primary}50`}} 
              disabled={selectedOption === null}
              onClick={handleAnswer}
            >
              {currentQuestion + 1 === activeQuiz.perguntas.length ? 'Finalizar e Ver Nota' : 'Próxima Pergunta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 1: LISTA DE QUIZZES (CARREGADOS DA BD)
  // ==========================================
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.warning} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Quizzes e Avaliações
          </h1>
          <p style={{color: theme.textSub, margin: '8px 0 0 0', fontSize: '14px'}}>Testa os teus conhecimentos nos módulos em que estás inscrito.</p>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '60px', color: theme.textSub}}>
           A carregar avaliações da base de dados...
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `2px dashed ${theme.inputBorder}`}}>
          <div style={{ backgroundColor: theme.inputBg, width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto' }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textSub} strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3 style={{color: theme.textMain, margin: '0 0 8px 0'}}>Nenhuma avaliação disponível</h3>
          <p style={{color: theme.textSub, fontSize: '14px', margin: 0}}>Os professores ainda não adicionaram quizzes aos cursos.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} style={styles.card} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={styles.badge}>Módulo de Avaliação</div>
              <h4 style={styles.title}>{quiz.titulo}</h4>
              
              <p style={styles.desc}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                {quiz.nome_curso || 'Curso Geral'}
              </p>
              
              <p style={{fontSize: '13px', color: theme.textSub, marginTop: 'auto', marginBottom: '20px', padding: '8px 12px', backgroundColor: theme.inputBg, borderRadius: '8px', display: 'inline-block', alignSelf: 'flex-start', fontWeight: 'bold'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px', verticalAlign: '-2px'}}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Contém {quiz.perguntas.length} Perguntas
              </p>
              
              <button 
                style={styles.button} 
                onClick={() => handleStartQuiz(quiz)}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
              >
                Iniciar Avaliação
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
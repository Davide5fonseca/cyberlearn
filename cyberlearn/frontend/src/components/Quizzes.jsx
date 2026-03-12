import { useState } from 'react';

export default function Quizzes({ theme }) {
  // Estado para controlar se estamos na lista, a fazer um quiz, ou a ver os resultados
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Simulação da Base de Dados de Quizzes
  const quizzesData = [
    {
      id: 1,
      titulo: 'Quiz: Ataques de Phishing',
      descricao: 'Testa os teus conhecimentos sobre engenharia social e emails fraudulentos.',
      perguntas: [
        { pergunta: 'Qual é o principal objetivo do Phishing?', opcoes: ['Melhorar a velocidade da internet', 'Roubar dados confidenciais', 'Instalar antivírus', 'Atualizar o sistema'], respostaCerta: 1 },
        { pergunta: 'O que deves fazer se receberes um email suspeito do teu banco?', opcoes: ['Clicar no link para confirmar', 'Responder com a password', 'Ignorar e contactar o banco diretamente', 'Reencaminhar para amigos'], respostaCerta: 2 },
        { pergunta: 'Qual destes URLs é mais provável ser um ataque de phishing?', opcoes: ['https://www.paypal.com/login', 'https://secure.paypal-update-info.com', 'https://www.paypal.pt', 'Nenhum dos anteriores'], respostaCerta: 1 }
      ]
    },
    {
      id: 2,
      titulo: 'Quiz: Fundamentos de Redes',
      descricao: 'Avaliação do Módulo 2 sobre protocolos TCP/IP e segurança de rede.',
      perguntas: [] // Quiz vazio para simular que está bloqueado ou em construção
    }
  ];

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
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { backgroundColor: theme.cardBg, borderRadius: '12px', padding: '25px', boxShadow: theme.shadow, display: 'flex', flexDirection: 'column' },
    title: { fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 10px 0' },
    desc: { fontSize: '13px', color: theme.textSub, margin: '0 0 20px 0', lineHeight: '1.5' },
    badge: { padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: '15px', backgroundColor: `${theme.primary}20`, color: theme.primary },
    button: { width: '100%', backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto', textTransform: 'uppercase' },
    
    // Estilos da área de perguntas
    optionBtn: (isSelected) => ({
      width: '100%', padding: '15px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', fontSize: '14px', transition: 'all 0.2s ease',
      backgroundColor: isSelected ? `${theme.primary}30` : theme.inputBg,
      border: `2px solid ${isSelected ? theme.primary : theme.inputBorder}`,
      color: theme.textMain
    }),
    progressText: { color: theme.textSub, fontSize: '13px', fontWeight: 'bold', marginBottom: '15px', display: 'block' }
  };

  // VISTA 3: RESULTADOS DO QUIZ
  if (showResults) {
    const passed = score >= activeQuiz.perguntas.length / 2;
    return (
      <div style={{...styles.card, alignItems: 'center', textAlign: 'center', padding: '50px'}}>
        <div style={{width: '80px', height: '80px', borderRadius: '50%', backgroundColor: passed ? `${theme.success}20` : `${theme.danger}20`, color: passed ? theme.success : theme.danger, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px'}}>
          {passed ? 
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : 
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          }
        </div>
        <h2 style={{color: theme.textMain, margin: '0 0 10px 0'}}>Quiz Terminado!</h2>
        <p style={{color: theme.textSub, fontSize: '16px'}}>Acertaste em <strong style={{color: theme.primary}}>{score}</strong> de {activeQuiz.perguntas.length} perguntas.</p>
        {passed ? 
          <p style={{color: theme.success, fontWeight: 'bold', marginTop: '10px'}}>Parabéns! Módulo aprovado. +100 XP</p> : 
          <p style={{color: theme.danger, fontWeight: 'bold', marginTop: '10px'}}>Não atingiste a nota mínima. Tenta novamente!</p>
        }
        <button style={{...styles.button, width: 'auto', padding: '12px 30px', marginTop: '30px'}} onClick={() => setActiveQuiz(null)}>
          Voltar aos Quizzes
        </button>
      </div>
    );
  }

  // VISTA 2: A RESPONDER AO QUIZ
  if (activeQuiz) {
    const currentQData = activeQuiz.perguntas[currentQuestion];
    return (
      <div style={styles.card}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <span style={styles.progressText}>Pergunta {currentQuestion + 1} de {activeQuiz.perguntas.length}</span>
          <span style={{color: theme.primary, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}} onClick={() => setActiveQuiz(null)}>Abandonar Quiz</span>
        </div>
        
        <h2 style={{color: theme.textMain, fontSize: '20px', marginBottom: '30px', lineHeight: '1.4'}}>
          {currentQData.pergunta}
        </h2>

        <div>
          {currentQData.opcoes.map((opcao, index) => (
            <button 
              key={index} 
              style={styles.optionBtn(selectedOption === index)}
              onClick={() => setSelectedOption(index)}
            >
              {String.fromCharCode(65 + index)}. {opcao} {/* A, B, C, D */}
            </button>
          ))}
        </div>

        <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end'}}>
          <button 
            style={{...styles.button, width: 'auto', padding: '12px 30px', opacity: selectedOption === null ? 0.5 : 1, cursor: selectedOption === null ? 'not-allowed' : 'pointer'}} 
            disabled={selectedOption === null}
            onClick={handleAnswer}
          >
            {currentQuestion + 1 === activeQuiz.perguntas.length ? 'Finalizar Quiz' : 'Próxima Pergunta'}
          </button>
        </div>
      </div>
    );
  }

  // VISTA 1: LISTA DE QUIZZES
  return (
    <>
      <h2 style={{ fontSize: '18px', color: theme.textMain, marginBottom: '20px', fontWeight: 'bold' }}>Quizzes Disponíveis</h2>
      <div style={styles.grid}>
        {quizzesData.map((quiz) => (
          <div key={quiz.id} style={styles.card}>
            <div style={styles.badge}>Módulo de Teste</div>
            <h4 style={styles.title}>{quiz.titulo}</h4>
            <p style={styles.desc}>{quiz.descricao}</p>
            <p style={{fontSize: '12px', color: theme.textSub, marginTop: 'auto', marginBottom: '15px'}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '5px', verticalAlign: '-1px'}}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {quiz.perguntas.length} Perguntas
            </p>
            <button style={styles.button} onClick={() => handleStartQuiz(quiz)}>Começar Quiz</button>
          </div>
        ))}
      </div>
    </>
  );
}
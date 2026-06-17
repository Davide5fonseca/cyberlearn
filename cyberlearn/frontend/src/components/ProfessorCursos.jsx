import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { apiFetch } from '../api';
import { useUI } from './ui/UIProvider';

export default function ProfessorCursos({ theme, user }) {
  const { notify, confirm } = useUI();
  const [activeTab, setActiveTab] = useState('gerirCursos');
  
  const [cursosReais, setCursosReais] = useState([]); 
  const [quizzesReais, setQuizzesReais] = useState([]); 
  
  const [viewingCurso, setViewingCurso] = useState(null);
  const [viewingQuiz, setViewingQuiz] = useState(null);
  
  const [editingCursoId, setEditingCursoId] = useState(null); 
  const [editingQuizTitulo, setEditingQuizTitulo] = useState(null); 
  
  const [cursoData, setCursoData] = useState({ titulo: '', nivel: 'iniciante', descricao: '' });
  const [numeroLicoes, setNumeroLicoes] = useState(1);
  const [licoes, setLicoes] = useState(['']); 
  
  const [quizMeta, setQuizMeta] = useState({ titulo: '', nome_curso: '' });
  const [numeroPerguntas, setNumeroPerguntas] = useState(1);
  const [perguntasQuiz, setPerguntasQuiz] = useState([{ pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 'A' }]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      buscarCursos();
      buscarQuizzes(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id]);

  const buscarCursos = async () => {
    try {
      setLoading(true);
      // Rota Exclusiva do Professor: Traz aprovados e não aprovados
      const res = await apiFetch(`/professor/cursos/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setCursosReais(data);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const buscarQuizzes = async () => {
    try {
      // Rota Exclusiva do Professor: Traz aprovados e não aprovados
      const res = await apiFetch(`/professor/quizzes/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const grouped = {};
        data.forEach(q => {
          if (!grouped[q.titulo]) {
            // Guarda o estado de aprovação
            grouped[q.titulo] = { titulo: q.titulo, nome_curso: q.nome_curso, aprovado: q.aprovado, perguntas: [] };
          }
          grouped[q.titulo].perguntas.push(q);
        });
        setQuizzesReais(Object.values(grouped));
      }
    } catch (err) { console.error(err); }
  };

  const goNovoCurso = () => {
    setEditingCursoId(null);
    setCursoData({ titulo: '', nivel: 'iniciante', descricao: '' });
    setNumeroLicoes(1);
    setLicoes(['']);
    setActiveTab('createCourse');
  };

  const goNovoQuiz = () => {
    setEditingQuizTitulo(null);
    setQuizMeta({ titulo: '', nome_curso: '' });
    setNumeroPerguntas(1);
    setPerguntasQuiz([{ pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 'A' }]);
    setActiveTab('createQuiz');
  };

  const handleEditCurso = () => {
    setCursoData({ titulo: viewingCurso.titulo, nivel: viewingCurso.nivel || 'iniciante', descricao: viewingCurso.descricao || '' });
    let parsedLicoes = [''];
    try {
      const parsed = JSON.parse(viewingCurso.conteudo_licao);
      if (Array.isArray(parsed)) parsedLicoes = parsed;
      else parsedLicoes = [viewingCurso.conteudo_licao];
    } catch (e) { parsedLicoes = [viewingCurso.conteudo_licao]; }
    
    setLicoes(parsedLicoes);
    setNumeroLicoes(parsedLicoes.length);
    setEditingCursoId(viewingCurso.id);
    setViewingCurso(null);
    setActiveTab('createCourse');
  };

  const handleEditQuiz = () => {
    setQuizMeta({ titulo: viewingQuiz.titulo, nome_curso: viewingQuiz.nome_curso });
    setPerguntasQuiz(viewingQuiz.perguntas);
    setNumeroPerguntas(viewingQuiz.perguntas.length);
    setEditingQuizTitulo(viewingQuiz.titulo);
    setViewingQuiz(null);
    setActiveTab('createQuiz');
  };

  const handleDeleteCurso = async (e, cursoId) => {
    e.stopPropagation();
    if (!(await confirm({ title: 'Apagar curso', message: "Tens a certeza que queres APAGAR este curso para sempre? Esta ação apagará também os quizzes associados.", confirmLabel: 'Apagar', danger: true }))) return;
    try {
      const response = await apiFetch(`/cursos/${cursoId}`, { method: 'DELETE' });
      if (response.ok) {
        notify("Curso apagado com sucesso.", 'success');
        setCursosReais(cursosReais.filter(curso => curso.id !== cursoId));
        buscarQuizzes();
      } else { notify('Não foi possível apagar o curso.', 'error'); }
    } catch (error) { notify("Erro de ligação.", 'error'); }
  };

  const handleDeleteQuiz = async (e, titulo) => {
    e.stopPropagation();
    if (!(await confirm({ title: 'Apagar avaliação', message: `Tens a certeza que queres APAGAR a avaliação "${titulo}"?`, confirmLabel: 'Apagar', danger: true }))) return;
    try {
      const response = await apiFetch(`/quizzes/${encodeURIComponent(titulo)}`, { method: 'DELETE' });
      if (response.ok) {
        notify("Quiz apagado com sucesso.", 'success');
        setQuizzesReais(quizzesReais.filter(q => q.titulo !== titulo));
      } else { notify('Não foi possível apagar o quiz.', 'error'); }
    } catch (error) { notify("Erro de ligação.", 'error'); }
  };

  const handleCursoChange = (e) => setCursoData({ ...cursoData, [e.target.name]: e.target.value });
  const handleLicaoTextoChange = (index, value) => { const newLicoes = [...licoes]; newLicoes[index] = value; setLicoes(newLicoes); };
  const handleQuizMetaChange = (e) => setQuizMeta({ ...quizMeta, [e.target.name]: e.target.value });
  const handlePerguntaChange = (index, field, value) => { const novasPerguntas = [...perguntasQuiz]; novasPerguntas[index][field] = value; setPerguntasQuiz(novasPerguntas); };
  
  const handleNumeroLicoesChange = (e) => {
    const num = parseInt(e.target.value);
    setNumeroLicoes(num);
    setLicoes(prev => {
      const newLicoes = [...prev];
      if (num > prev.length) for (let i = prev.length; i < num; i++) newLicoes.push('');
      else newLicoes.length = num;
      return newLicoes;
    });
  };

  const handleNumeroPerguntasChange = (e) => {
    const num = parseInt(e.target.value);
    setNumeroPerguntas(num);
    setPerguntasQuiz(prev => {
      const novasPerguntas = [...prev];
      if (num > prev.length) {
        for (let i = prev.length; i < num; i++) novasPerguntas.push({ pergunta: '', opcao_a: '', opcao_b: '', opcao_c: '', opcao_d: '', resposta_correta: 'A' });
      } else novasPerguntas.length = num;
      return novasPerguntas;
    });
  };

  const insertFormatting = (index, tagStart, tagEnd) => {
    const textarea = document.getElementById(`conteudoLicao_${index}`);
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = licoes[index];
    const newText = text.substring(0, start) + tagStart + text.substring(start, end) + tagEnd + text.substring(end);
    handleLicaoTextoChange(index, newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + tagStart.length, end + tagStart.length); }, 0);
  };

  const insertTemplate = async (index) => {
    const templateHTML = `<h2>O que é [Tema do Curso]?</h2>\n\n<p>Uma breve explicação sobre o tema principal do curso.</p>\n\n<div style="padding: 15px; background-color: #1e293b; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 20px 0;">\n  <h4 style="color: #3b82f6; margin-top: 0;">ℹ️ Dica de Segurança</h4>\n  <p style="margin-bottom: 0;">Escreve aqui um aviso importante para o aluno.</p>\n</div>\n\n<h3>Sinais Vermelhos a procurar:</h3>\n<ul>\n  <li><strong>Ponto 1:</strong> Explicação do ponto 1.</li>\n  <li><strong>Ponto 2:</strong> Explicação do ponto 2.</li>\n</ul>`;
    if (licoes[index].length > 0 && !(await confirm("Isto vai substituir o texto desta lição. Continuar?"))) return;
    handleLicaoTextoChange(index, templateHTML);
  };


  const handleSubmitCurso = async (e) => { 
    e.preventDefault(); 
    try {
      const conteudoFinal = JSON.stringify(licoes);
      const url = editingCursoId ? `/cursos/${editingCursoId}` : '/cursos';
      const method = editingCursoId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cursoData, conteudo_licao: conteudoFinal, professor_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.mensagem || 'Curso guardado!', 'success');
        goNovoCurso();
        setActiveTab('gerirCursos');
      } else notify(data.erro || 'Não foi possível guardar o curso.', 'error');
    } catch (err) { notify("Erro de ligação.", 'error'); }
  };

  const handleSubmitQuiz = async (e) => { 
    e.preventDefault(); 
    const cursoEncontrado = cursosReais.find(c => c.titulo.toLowerCase().trim() === quizMeta.nome_curso.toLowerCase().trim());
    if (!cursoEncontrado) {
        notify("O curso que escreveste não foi encontrado. Garante que o nome está igual ao que criaste.", 'error');
        return;
    }

    try {
      if (editingQuizTitulo) {
        await apiFetch(`/quizzes/${encodeURIComponent(editingQuizTitulo)}`, { method: 'DELETE' });
      }

      let perguntasGuardadas = 0;
      for (const p of perguntasQuiz) {
        const dadosParaEnviar = { titulo: quizMeta.titulo, curso_id: cursoEncontrado.id, ...p };
        const res = await apiFetch('/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosParaEnviar) });
        if (res.ok) perguntasGuardadas++;
      }

      // Reporta o resultado real: não declarar sucesso se algumas perguntas falharam.
      if (perguntasGuardadas === perguntasQuiz.length) {
        notify(`Avaliação com ${perguntasGuardadas} pergunta(s) guardada com sucesso!`, 'success');
      } else {
        notify(`Apenas ${perguntasGuardadas} de ${perguntasQuiz.length} perguntas foram guardadas. Verifica a avaliação e tenta guardar as restantes.`, 'warning');
      }
      goNovoQuiz();
      setActiveTab('gerirCursos');

    } catch (err) { notify("Erro ao guardar quiz.", 'error'); }
  };

  const styles = {
    container: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' },
    tabsContainer: { display: 'inline-flex', gap: '4px', backgroundColor: theme.inputBg, padding: '6px', borderRadius: '10px', boxShadow: `inset 0 2px 4px rgba(0,0,0,0.1)` },
    tabButton: (isActive) => ({ backgroundColor: isActive ? theme.primary : 'transparent', color: isActive ? 'white' : theme.textSub, border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: isActive ? 'bold' : '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: isActive ? `0 4px 8px ${theme.primary}50` : 'none' }),
    card: { backgroundColor: theme.cardBg, borderRadius: '12px', padding: '30px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}40` },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: theme.textMain, fontSize: '13px' },
    th: { padding: '12px', borderBottom: `2px solid ${theme.inputBorder}`, color: theme.textSub, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' },
    td: { padding: '12px', borderBottom: `1px solid ${theme.inputBorder}60`, verticalAlign: 'middle' },
    inputWrapper: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '11px', color: theme.textSub, fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' },
    input: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '12px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit' },
    textarea: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '12px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '90px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' },
    submitButton: { backgroundColor: theme.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.1s, opacity 0.2s', boxShadow: `0 4px 10px ${theme.primary}50` },
    deleteButton: { backgroundColor: `${theme.danger}15`, color: theme.danger, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s' },
    viewButton: { backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'background-color 0.2s' },
    backBtn: { backgroundColor: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.inputBorder}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', transition: 'all 0.2s', marginBottom: '20px' },
    editorToolbar: { display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' },
    editorBtn: { backgroundColor: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', transition: 'all 0.2s' },
    levelBadge: (nivel) => {
      const n = String(nivel || 'iniciante').toLowerCase();
      return { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: n === 'iniciante' ? `${theme.success}20` : n === 'avancado' ? `${theme.danger}20` : `${theme.warning}20`, color: n === 'iniciante' ? theme.success : n === 'avancado' ? theme.danger : theme.warning };
    },
    statusBadge: (isApproved) => ({
      padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
      backgroundColor: isApproved ? `${theme.success}20` : `${theme.warning}20`,
      color: isApproved ? theme.success : theme.warning
    })
  };


  // VISTA DE DETALHES

  if (viewingCurso) {
    let conteudosLicao = [];
    try {
      conteudosLicao = JSON.parse(viewingCurso.conteudo_licao);
      if (!Array.isArray(conteudosLicao)) conteudosLicao = [viewingCurso.conteudo_licao];
    } catch (e) {
      conteudosLicao = [viewingCurso.conteudo_licao];
    }

    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => setViewingCurso(null)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Voltar aos Conteúdos
        </button>

        <style>
          {`
            .licao-preview * { color: ${theme.textMain} !important; }
            .licao-preview [style*="background"], .licao-preview blockquote {
              background-color: ${theme.inputBg} !important; border-left: 4px solid ${theme.primary} !important; padding: 15px 20px !important; border-radius: 8px !important; margin: 15px 0 !important;
            }
          `}
        </style>

        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${theme.inputBorder}60`, paddingBottom: '20px', flexWrap: 'wrap', gap: '15px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{backgroundColor: `${theme.primary}20`, padding: '15px', borderRadius: '12px', color: theme.primary}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
              <div>
                <h1 style={{margin: '0 0 5px 0', fontSize: '24px', color: theme.textMain}}>{viewingCurso.titulo}</h1>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <span style={styles.levelBadge(viewingCurso.nivel)}>{viewingCurso.nivel}</span>
                  <span style={styles.statusBadge(viewingCurso.aprovado)}>
                    {viewingCurso.aprovado ? "🟢 Online" : "⏳ Pendente"}
                  </span>
                  <span style={{fontSize: '12px', color: theme.textSub, fontWeight: 'bold'}}>{conteudosLicao.length} Lições</span>
                </div>
              </div>
            </div>
            <button onClick={handleEditCurso} style={{...styles.submitButton, margin: 0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Editar Curso
            </button>
          </div>

          <p style={{color: theme.textSub, fontSize: '14px', lineHeight: '1.6', marginBottom: '40px'}}>{viewingCurso.descricao}</p>

          {conteudosLicao.map((htmlTexto, idx) => {
            const htmlLimpo = DOMPurify.sanitize(htmlTexto.replace(/background-color:\s*[^;"]+;?/gi, '').replace(/color:\s*[^;"]+;?/gi, '').replace(/background:\s*[^;"]+;?/gi, ''), { USE_PROFILES: { html: true } });
            return (
              <div key={idx} style={{marginBottom: '30px', padding: '25px', backgroundColor: theme.inputBg, borderRadius: '12px', border: `1px solid ${theme.inputBorder}40`}}>
                <h3 style={{margin: '0 0 20px 0', color: theme.primary, borderBottom: `2px solid ${theme.primary}30`, paddingBottom: '10px', display: 'inline-block'}}>
                  Lição {idx + 1}
                </h3>
                <div className="licao-preview" style={{fontSize: '14px', lineHeight: '1.8'}} dangerouslySetInnerHTML={{ __html: htmlLimpo }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA DE DETALHE: VER QUIZ 
  if (viewingQuiz) {
    const renderOpcao = (letra, texto, correta) => {
      if (!texto) return null;
      const isCorrect = letra === correta;
      return (
        <div style={{ padding: '12px 16px', backgroundColor: isCorrect ? `${theme.success}15` : theme.inputBg, border: `2px solid ${isCorrect ? theme.success : theme.inputBorder}40`, borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
           <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '26px', height: '26px', borderRadius: '6px', backgroundColor: isCorrect ? theme.success : theme.inputBorder, color: isCorrect ? 'white' : theme.textSub, fontWeight: 'bold', fontSize: '12px' }}>
             {letra}
           </span>
           <span style={{ color: theme.textMain, fontSize: '14px', fontWeight: isCorrect ? 'bold' : 'normal' }}>{texto}</span>
           {isCorrect && <span style={{ marginLeft: 'auto', color: theme.success, fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
             Correta
           </span>}
        </div>
      );
    };

    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => setViewingQuiz(null)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Voltar aos Conteúdos
        </button>

        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', borderBottom: `1px solid ${theme.inputBorder}60`, paddingBottom: '20px', flexWrap: 'wrap', gap: '15px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{backgroundColor: `${theme.warning}20`, padding: '15px', borderRadius: '12px', color: theme.warning}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </div>
              <div>
                <h1 style={{margin: '0 0 5px 0', fontSize: '24px', color: theme.textMain}}>Gabarito: {viewingQuiz.titulo}</h1>
                <p style={{margin: 0, color: theme.textSub, fontSize: '13px', fontWeight: 'bold'}}>
                  Associado ao Curso: <span style={{color: theme.primary}}>{viewingQuiz.nome_curso}</span> | {viewingQuiz.perguntas.length} Perguntas
                  <span style={{...styles.statusBadge(viewingQuiz.aprovado), marginLeft: '10px'}}>
                    {viewingQuiz.aprovado ? "🟢 Online" : "⏳ Pendente"}
                  </span>
                </p>
              </div>
            </div>

            {/* BOTÃO EDITAR QUIZ */}
            <button onClick={handleEditQuiz} style={{...styles.submitButton, backgroundColor: theme.warning, boxShadow: `0 4px 10px ${theme.warning}50`, margin: 0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Editar Quiz
            </button>
          </div>

          {viewingQuiz.perguntas.map((q, idx) => (
            <div key={idx} style={{marginBottom: '30px', padding: '20px', borderRadius: '12px', border: `1px solid ${theme.inputBorder}60`, backgroundColor: theme.cardBg}}>
              <h3 style={{margin: '0 0 20px 0', color: theme.textMain, fontSize: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px'}}>
                <span style={{color: theme.warning, fontWeight: '900', fontSize: '18px'}}>Q{idx + 1}.</span>
                {q.pergunta}
              </h3>
              
              <div style={{paddingLeft: '35px'}}>
                {renderOpcao('A', q.opcao_a, q.resposta_correta)}
                {renderOpcao('B', q.opcao_b, q.resposta_correta)}
                {renderOpcao('C', q.opcao_c, q.resposta_correta)}
                {renderOpcao('D', q.opcao_d, q.resposta_correta)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA PRINCIPAL COM OS TABS
  // ==========================================
  return (
    <div style={styles.container}>
      <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' }}>
        <div style={styles.tabsContainer}>
          <button style={styles.tabButton(activeTab === 'gerirCursos')} onClick={() => setActiveTab('gerirCursos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> 
            Contéudos Publicados
          </button>
          <button style={styles.tabButton(activeTab === 'createCourse')} onClick={goNovoCurso}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            {editingCursoId ? "Editar Curso" : "Novo Curso"}
          </button>
          <button style={styles.tabButton(activeTab === 'createQuiz')} onClick={goNovoQuiz}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            {editingQuizTitulo ? "Editar Quiz" : "Novo Quiz"}
          </button>
        </div>
      </div>

      {/* ABA: GERIR CURSOS & QUIZZES */}
      {activeTab === 'gerirCursos' && (
        <>
          {/* TABELA DE CURSOS */}
          <div style={styles.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
              <div>
                <h2 style={styles.sectionTitle}>Os Teus Cursos Publicados</h2>
                <p style={{color: theme.textSub, fontSize: '13px', margin: 0}}>Visão geral dos conteúdos disponibilizados aos alunos.</p>
              </div>
              <button style={styles.submitButton} onClick={goNovoCurso}>+ Adicionar Curso</button>
            </div>
            
            {loading ? (
              <div style={{textAlign: 'center', padding: '30px 0', color: theme.textSub}}>A carregar dados...</div>
            ) : cursosReais.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 20px', border: `2px dashed ${theme.inputBorder}`, borderRadius: '12px', backgroundColor: theme.inputBg}}>
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
                      <th style={styles.th}>Estado</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosReais.map(curso => (
                      <tr key={curso.id} style={{transition: 'background-color 0.2s', cursor: 'pointer', ':hover': { backgroundColor: theme.inputBg }}} onClick={() => setViewingCurso(curso)}>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{curso.titulo}</td>
                        <td style={styles.td}><span style={styles.levelBadge(curso.nivel)}>{curso.nivel || 'Iniciante'}</span></td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge(curso.aprovado)}>
                            {curso.aprovado ? 'Online' : 'Pendente'}
                          </span>
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                            <button style={styles.viewButton} onClick={(e) => { e.stopPropagation(); setViewingCurso(curso); }}>Ver Detalhes</button>
                            <button style={styles.deleteButton} onClick={(e) => handleDeleteCurso(e, curso.id)}>Apagar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TABELA DE QUIZZES */}
          <div style={{...styles.card, marginTop: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
              <div>
                <h2 style={styles.sectionTitle}>Os teus Quizzes publicados</h2>
                <p style={{color: theme.textSub, fontSize: '13px', margin: 0}}>Gestão de testes associados aos teus cursos.</p>
              </div>
              <button style={{...styles.submitButton, backgroundColor: theme.warning, boxShadow: `0 4px 10px ${theme.warning}50`}} onClick={goNovoQuiz}>+ Adicionar Quiz</button>
            </div>
            
            {loading ? (
              <div style={{textAlign: 'center', padding: '30px 0', color: theme.textSub}}>A carregar dados...</div>
            ) : quizzesReais.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 20px', border: `2px dashed ${theme.inputBorder}`, borderRadius: '12px', backgroundColor: theme.inputBg}}>
                 <h3 style={{color: theme.textMain, margin: '0 0 5px 0', fontSize: '16px'}}>Ainda não tens avaliações</h3>
                 <p style={{color: theme.textSub, margin: 0, fontSize: '13px'}}>Cria um quiz para testar os conhecimentos dos teus alunos.</p>
              </div>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Título do Quiz</th>
                      <th style={styles.th}>Associado ao Curso</th>
                      <th style={styles.th}>Total de Perguntas</th>
                      <th style={styles.th}>Estado</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzesReais.map((quiz, idx) => (
                      <tr key={idx} style={{transition: 'background-color 0.2s', cursor: 'pointer', ':hover': { backgroundColor: theme.inputBg }}} onClick={() => setViewingQuiz(quiz)}>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{quiz.titulo}</td>
                        <td style={styles.td}><span style={{color: theme.primary, fontWeight: '600'}}>{quiz.nome_curso}</span></td>
                        <td style={styles.td}>{quiz.perguntas.length} {quiz.perguntas.length === 1 ? 'Pergunta' : 'Perguntas'}</td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge(quiz.aprovado)}>
                            {quiz.aprovado ? 'Online' : 'Pendente'}
                          </span>
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                            <button style={styles.viewButton} onClick={(e) => { e.stopPropagation(); setViewingQuiz(quiz); }}>Ver Detalhes</button>
                            <button style={styles.deleteButton} onClick={(e) => handleDeleteQuiz(e, quiz.titulo)}>Apagar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'createCourse' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>{editingCursoId ? "Editar Curso" : "Construir Novo Curso"}</h2>
          <p style={{color: theme.textSub, fontSize: '13px', marginBottom: '20px'}}>Preenche os detalhes e usa HTML para desenhar lições avançadas.</p>
          
          <form onSubmit={handleSubmitCurso}>
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px'}}>
              <div style={{...styles.inputWrapper, flex: '1 1 250px', marginBottom: 0}}>
                <label style={styles.label}>Título do Curso</label>
                <input style={styles.input} type="text" name="titulo" value={cursoData.titulo} onChange={handleCursoChange} placeholder="Ex: Fundamentos de Cibersegurança" required />
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 150px', marginBottom: 0}}>
                <label style={styles.label}>Nível de Dificuldade</label>
                <select style={styles.input} name="nivel" value={cursoData.nivel} onChange={handleCursoChange}>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermedio">Intermédio</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 100px', marginBottom: 0}}>
                <label style={styles.label}>Nº de Lições</label>
                <select style={{...styles.input, borderColor: theme.primary, fontWeight: 'bold'}} value={numeroLicoes} onChange={handleNumeroLicoesChange}>
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{backgroundColor: theme.inputBg, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}60`, marginBottom: '20px'}}>
              <div style={{...styles.inputWrapper, marginBottom: 0}}>
                <label style={styles.label}>Descrição Rápida (Aparece no Catálogo)</label>
                <textarea style={{...styles.textarea, minHeight: '60px'}} name="descricao" value={cursoData.descricao} onChange={handleCursoChange} placeholder="Escreve um pequeno resumo que cative os alunos..." required></textarea>
              </div>
            </div>

            {licoes.map((licaoTexto, index) => (
              <div key={index} style={{backgroundColor: theme.inputBg, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.primary}40`, marginBottom: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <h3 style={{margin: 0, color: theme.primary, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{backgroundColor: theme.primary, color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}>{index + 1}</div>
                    Conteúdo da Lição {index + 1}
                  </h3>
                  
                  <button 
                    type="button" 
                    style={{...styles.editorBtn, backgroundColor: theme.primary, color: 'white', border: 'none'}} 
                    onClick={() => insertTemplate(index)}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                  >
                    📝 Carregar Layout Base
                  </button>
                </div>
                
                <div style={styles.editorToolbar}>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<h2>', '</h2>')}>Título H2</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<h3>', '</h3>')}>Título H3</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<strong>', '</strong>')}>Negrito</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<p>', '</p>')}>Parágrafo</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<ul>\n  <li>', '</li>\n</ul>')}>Lista</button>
                  <button type="button" style={{...styles.editorBtn, color: theme.warning, borderColor: `${theme.warning}50`}} onClick={() => insertFormatting(index, `<div style="padding: 15px; background-color: ${theme.cardBg}; border-left: 4px solid ${theme.primary}; border-radius: 4px; margin: 20px 0;">\n  <h4 style="color: ${theme.primary}; margin-top: 0;">ℹ️ Dica de Segurança</h4>\n  <p style="margin-bottom: 0;">`, '</p>\n</div>')}>Caixa de Dica</button>
                </div>
                
                <textarea 
                  id={`conteudoLicao_${index}`}
                  style={{...styles.textarea, minHeight: '200px', fontFamily: 'monospace', fontSize: '13px', border: `1px dashed ${theme.inputBorder}`}} 
                  value={licaoTexto} 
                  onChange={(e) => handleLicaoTextoChange(index, e.target.value)} 
                  placeholder="Escreve aqui a tua lição. Podes usar HTML como <h2>, <p> e <ul> para criar listas ou formatar o texto tal como na plataforma."
                  required
                ></textarea>
              </div>
            ))}

            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '30px'}}>
              <button type="submit" style={styles.submitButton}>{editingCursoId ? "Guardar Alterações" : "Guardar Curso"}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'createQuiz' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>{editingQuizTitulo ? "Editar Avaliação" : "Criar Avaliação"}</h2>
          <p style={{color: theme.textSub, fontSize: '13px', marginBottom: '20px'}}>Gera um teste para avaliar os conhecimentos dos alunos.</p>

          <form onSubmit={handleSubmitQuiz}>
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', backgroundColor: theme.inputBg, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}60`, marginBottom: '20px'}}>
              <div style={{...styles.inputWrapper, flex: '1 1 200px', marginBottom: 0}}>
                <label style={styles.label}>Título do Quiz</label>
                <input style={styles.input} type="text" name="titulo" value={quizMeta.titulo} onChange={handleQuizMetaChange} placeholder="Ex: Avaliação Final de Redes" required />
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 200px', marginBottom: 0}}>
                <label style={styles.label}>Escreve o Nome do Curso Associado</label>
                <input style={styles.input} type="text" list="cursos-list" name="nome_curso" value={quizMeta.nome_curso} onChange={handleQuizMetaChange} placeholder="Ex: Introdução ao Phishing" required autoComplete="off" />
                <datalist id="cursos-list">
                  {cursosReais.map(curso => (<option key={curso.id} value={curso.titulo} />))}
                </datalist>
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 100px', marginBottom: 0}}>
                <label style={styles.label}>Nº de Perguntas</label>
                <select style={{...styles.input, borderColor: theme.warning, fontWeight: 'bold'}} value={numeroPerguntas} onChange={handleNumeroPerguntasChange}>
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {perguntasQuiz.map((q, index) => (
              <div key={index} style={{ padding: '20px', borderRadius: '10px', border: `2px dashed ${theme.warning}50`, marginBottom: '20px', backgroundColor: theme.inputBg }}>
                <h4 style={{color: theme.warning, margin: '0 0 15px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <div style={{backgroundColor: theme.warning, color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'}}>{index + 1}</div>
                  Estrutura da Pergunta {index + 1}
                </h4>
                
                <input style={{...styles.input, marginBottom: '20px'}} type="text" value={q.pergunta} onChange={(e) => handlePerguntaChange(index, 'pergunta', e.target.value)} placeholder="Ex: Qual destas opções é um ataque de Phishing?" required />
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                  <div style={{position: 'relative'}}>
                    <span style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>A.</span>
                    <input style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_a} onChange={(e) => handlePerguntaChange(index, 'opcao_a', e.target.value)} placeholder="Opção A" required />
                  </div>
                  <div style={{position: 'relative'}}>
                    <span style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>B.</span>
                    <input style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_b} onChange={(e) => handlePerguntaChange(index, 'opcao_b', e.target.value)} placeholder="Opção B" required />
                  </div>
                  <div style={{position: 'relative'}}>
                    <span style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>C.</span>
                    <input style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_c} onChange={(e) => handlePerguntaChange(index, 'opcao_c', e.target.value)} placeholder="Opção C (Opcional)" />
                  </div>
                  <div style={{position: 'relative'}}>
                    <span style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>D.</span>
                    <input style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_d} onChange={(e) => handlePerguntaChange(index, 'opcao_d', e.target.value)} placeholder="Opção D (Opcional)" />
                  </div>
                </div>

                <div style={{marginTop: '20px', padding: '12px 18px', backgroundColor: `${theme.warning}15`, borderRadius: '8px', display: 'inline-block'}}>
                  <label style={{...styles.label, display: 'inline', marginRight: '12px', color: theme.warning}}>Opção Certa:</label>
                  <select style={{...styles.input, width: 'auto', padding: '8px 16px', display: 'inline-block', borderColor: theme.warning, color: theme.textMain, fontWeight: 'bold'}} value={q.resposta_correta} onChange={(e) => handlePerguntaChange(index, 'resposta_correta', e.target.value)} required>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
              </div>
            ))}

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit" style={{...styles.submitButton, backgroundColor: theme.warning, boxShadow: `0 4px 10px ${theme.warning}50`}}>{editingQuizTitulo ? "Guardar Alterações" : "Guardar Quiz"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
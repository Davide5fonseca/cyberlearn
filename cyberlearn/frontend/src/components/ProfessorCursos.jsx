import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { apiFetch } from '../api';
import { useUI } from './ui/UIProvider';
import { useTranslation } from '../i18n';

export default function ProfessorCursos({ theme, user }) {
  const { notify, confirm } = useUI();
  const t = useTranslation();
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
      } else {
        console.error('Erro ao buscar cursos do professor:', res.status);
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
        // Agrupa por grupo_id: dois quizzes homónimos em cursos diferentes são distintos.
        const grouped = {};
        data.forEach(q => {
          if (!grouped[q.grupo_id]) {
            grouped[q.grupo_id] = { grupoId: q.grupo_id, titulo: q.titulo, nome_curso: q.nome_curso, aprovado: q.grupo_aprovado, perguntas: [] };
          }
          grouped[q.grupo_id].perguntas.push(q);
        });
        setQuizzesReais(Object.values(grouped));
      } else {
        console.error('Erro ao buscar quizzes do professor:', res.status);
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
    let parsedLicoes;
    try {
      const parsed = JSON.parse(viewingCurso.conteudo_licao);
      if (Array.isArray(parsed)) parsedLicoes = parsed;
      else parsedLicoes = [viewingCurso.conteudo_licao];
    } catch { parsedLicoes = [viewingCurso.conteudo_licao]; }
    
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
    setEditingQuizTitulo(viewingQuiz.grupoId);
    setViewingQuiz(null);
    setActiveTab('createQuiz');
  };

  const handleDeleteCurso = async (e, cursoId) => {
    e.stopPropagation();
    if (!(await confirm({ title: t('professor.cursos.apagarTitulo'), message: t('professor.cursos.apagarMensagem'), confirmLabel: t('professor.comum.apagar'), danger: true }))) return;
    try {
      const response = await apiFetch(`/cursos/${cursoId}`, { method: 'DELETE' });
      if (response.ok) {
        notify(t('professor.cursos.apagadoSucesso'), 'success');
        setCursosReais(cursosReais.filter(curso => curso.id !== cursoId));
        buscarQuizzes();
      } else { notify(t('professor.cursos.apagarErro'), 'error'); }
    } catch { notify(t('professor.comum.erroLigacao'), 'error'); }
  };

  const handleDeleteQuiz = async (e, quiz) => {
    e.stopPropagation();
    if (!(await confirm({ title: t('professor.quizzes.apagarTitulo'), message: t('professor.quizzes.apagarMensagem').replace('{titulo}', quiz.titulo), confirmLabel: t('professor.comum.apagar'), danger: true }))) return;
    try {
      const response = await apiFetch(`/quizzes/${quiz.grupoId}`, { method: 'DELETE' });
      if (response.ok) {
        notify(t('professor.quizzes.apagadoSucesso'), 'success');
        setQuizzesReais(quizzesReais.filter(q => q.grupoId !== quiz.grupoId));
      } else { notify(t('professor.quizzes.apagarErro'), 'error'); }
    } catch { notify(t('professor.comum.erroLigacao'), 'error'); }
  };

  const handleCursoChange = (e) => setCursoData({ ...cursoData, [e.target.name]: e.target.value });
  const handleLicaoTextoChange = (index, value) => { const newLicoes = [...licoes]; newLicoes[index] = value; setLicoes(newLicoes); };
  const handleQuizMetaChange = (e) => setQuizMeta({ ...quizMeta, [e.target.name]: e.target.value });
  // Atualização imutável: nunca mutar o objeto da pergunta que está no estado.
  const handlePerguntaChange = (index, field, value) => {
    setPerguntasQuiz(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };
  
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
    if (licoes[index].length > 0 && !(await confirm(t('professor.formCurso.confirmTemplate')))) return;
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
      // Lê o corpo de forma tolerante: o servidor pode responder sem JSON válido.
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify(data.mensagem || t('professor.formCurso.guardadoSucesso'), 'success');
        goNovoCurso();
        setActiveTab('gerirCursos');
      } else {
        console.error('Erro ao guardar curso:', res.status, data);
        notify(data.erro || t('professor.formCurso.guardarErro'), 'error');
      }
    } catch { notify(t('professor.comum.erroLigacao'), 'error'); }
  };

  const handleSubmitQuiz = async (e) => { 
    e.preventDefault(); 
    const cursoEncontrado = cursosReais.find(c => c.titulo.toLowerCase().trim() === quizMeta.nome_curso.toLowerCase().trim());
    if (!cursoEncontrado) {
        notify(t('professor.formQuiz.cursoNaoEncontrado'), 'error');
        return;
    }

    try {
      // Em modo edição, editingQuizTitulo guarda o grupo_id da avaliação original.
      if (editingQuizTitulo) {
        await apiFetch(`/quizzes/${editingQuizTitulo}`, { method: 'DELETE' });
      }

      let perguntasGuardadas = 0;
      for (const p of perguntasQuiz) {
        const dadosParaEnviar = { titulo: quizMeta.titulo, curso_id: cursoEncontrado.id, ...p };
        const res = await apiFetch('/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosParaEnviar) });
        if (res.ok) perguntasGuardadas++;
      }

      // Reporta o resultado real: não declarar sucesso se algumas perguntas falharam.
      if (perguntasGuardadas === perguntasQuiz.length) {
        notify(t('professor.formQuiz.guardadoSucesso').replace('{n}', perguntasGuardadas), 'success');
      } else {
        notify(t('professor.formQuiz.guardadoParcial').replace('{n}', perguntasGuardadas).replace('{total}', perguntasQuiz.length), 'warning');
      }
      goNovoQuiz();
      setActiveTab('gerirCursos');

    } catch { notify(t('professor.formQuiz.guardarErro'), 'error'); }
  };

  const styles = {
    container: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' },
    tabsContainer: { display: 'inline-flex', gap: '4px', backgroundColor: theme.inputBg, padding: '6px', borderRadius: '10px', boxShadow: `inset 0 2px 4px rgba(0,0,0,0.1)` },
    tabButton: (isActive) => ({ backgroundColor: isActive ? theme.primary : 'transparent', backgroundImage: isActive ? theme.gradient : 'none', color: isActive ? 'white' : theme.textSub, border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: isActive ? 'bold' : '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: isActive ? `0 4px 8px ${theme.primary}45` : 'none' }),
    card: { backgroundColor: theme.cardBg, borderRadius: '12px', padding: '30px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}40` },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: theme.textMain, fontSize: '13px' },
    th: { padding: '12px', borderBottom: `2px solid ${theme.inputBorder}`, color: theme.textSub, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' },
    td: { padding: '12px', borderBottom: `1px solid ${theme.inputBorder}60`, verticalAlign: 'middle' },
    inputWrapper: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '11px', color: theme.textSub, fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' },
    input: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '12px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit' },
    textarea: { width: '100%', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, padding: '12px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '90px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' },
    submitButton: { backgroundColor: theme.primary, backgroundImage: theme.gradient, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.1s, opacity 0.2s', boxShadow: `0 4px 10px ${theme.primary}45` },
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
    let conteudosLicao;
    try {
      conteudosLicao = JSON.parse(viewingCurso.conteudo_licao);
      if (!Array.isArray(conteudosLicao)) conteudosLicao = [viewingCurso.conteudo_licao];
    } catch {
      conteudosLicao = [viewingCurso.conteudo_licao];
    }

    return (
      <div style={styles.container}>
        <button type="button" style={styles.backBtn} onClick={() => setViewingCurso(null)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          {t('professor.comum.voltarConteudos')}
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
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
              <div>
                <h1 style={{margin: '0 0 5px 0', fontSize: '24px', color: theme.textMain}}>{viewingCurso.titulo}</h1>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <span style={styles.levelBadge(viewingCurso.nivel)}>{viewingCurso.nivel}</span>
                  <span style={styles.statusBadge(viewingCurso.aprovado)}>
                    {viewingCurso.aprovado ? t('professor.comum.onlineBadge') : t('professor.comum.pendenteBadge')}
                  </span>
                  <span style={{fontSize: '12px', color: theme.textSub, fontWeight: 'bold'}}>{t('professor.cursos.licoesContagem').replace('{n}', conteudosLicao.length)}</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleEditCurso} style={{...styles.submitButton, margin: 0}}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              {t('professor.cursos.editar')}
            </button>
          </div>

          <p style={{color: theme.textSub, fontSize: '14px', lineHeight: '1.6', marginBottom: '40px'}}>{viewingCurso.descricao}</p>

          {conteudosLicao.map((htmlTexto, idx) => {
            const htmlLimpo = DOMPurify.sanitize(htmlTexto.replace(/background-color:\s*[^;"]+;?/gi, '').replace(/color:\s*[^;"]+;?/gi, '').replace(/background:\s*[^;"]+;?/gi, ''), { USE_PROFILES: { html: true } });
            return (
              <div key={idx} style={{marginBottom: '30px', padding: '25px', backgroundColor: theme.inputBg, borderRadius: '12px', border: `1px solid ${theme.inputBorder}40`}}>
                <h3 style={{margin: '0 0 20px 0', color: theme.primary, borderBottom: `2px solid ${theme.primary}30`, paddingBottom: '10px', display: 'inline-block'}}>
                  {t('professor.cursos.licaoN').replace('{n}', idx + 1)}
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
             <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
             {t('professor.quizzes.correta')}
           </span>}
        </div>
      );
    };

    return (
      <div style={styles.container}>
        <button type="button" style={styles.backBtn} onClick={() => setViewingQuiz(null)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          {t('professor.comum.voltarConteudos')}
        </button>

        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', borderBottom: `1px solid ${theme.inputBorder}60`, paddingBottom: '20px', flexWrap: 'wrap', gap: '15px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{backgroundColor: `${theme.warning}20`, padding: '15px', borderRadius: '12px', color: theme.warning}}>
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </div>
              <div>
                <h1 style={{margin: '0 0 5px 0', fontSize: '24px', color: theme.textMain}}>{t('professor.quizzes.gabarito').replace('{titulo}', viewingQuiz.titulo)}</h1>
                <p style={{margin: 0, color: theme.textSub, fontSize: '13px', fontWeight: 'bold'}}>
                  {t('professor.quizzes.associadoAoCurso')} <span style={{color: theme.primary}}>{viewingQuiz.nome_curso}</span> | {viewingQuiz.perguntas.length} {viewingQuiz.perguntas.length === 1 ? t('professor.quizzes.perguntaSingular') : t('professor.quizzes.perguntaPlural')}
                  <span style={{...styles.statusBadge(viewingQuiz.aprovado), marginLeft: '10px'}}>
                    {viewingQuiz.aprovado ? t('professor.comum.onlineBadge') : t('professor.comum.pendenteBadge')}
                  </span>
                </p>
              </div>
            </div>

            {/* BOTÃO EDITAR QUIZ */}
            <button type="button" onClick={handleEditQuiz} style={{...styles.submitButton, backgroundColor: theme.warning, backgroundImage: 'none', boxShadow: `0 4px 10px ${theme.warning}50`, margin: 0}}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              {t('professor.quizzes.editar')}
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
          <button type="button" style={styles.tabButton(activeTab === 'gerirCursos')} onClick={() => setActiveTab('gerirCursos')}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            {t('professor.tabs.conteudos')}
          </button>
          <button type="button" style={styles.tabButton(activeTab === 'createCourse')} onClick={goNovoCurso}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            {editingCursoId ? t('professor.tabs.editarCurso') : t('professor.tabs.novoCurso')}
          </button>
          <button type="button" style={styles.tabButton(activeTab === 'createQuiz')} onClick={goNovoQuiz}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            {editingQuizTitulo ? t('professor.tabs.editarQuiz') : t('professor.tabs.novoQuiz')}
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
                <h2 style={styles.sectionTitle}>{t('professor.cursos.titulo')}</h2>
                <p style={{color: theme.textSub, fontSize: '13px', margin: 0}}>{t('professor.cursos.subtitulo')}</p>
              </div>
              <button type="button" style={styles.submitButton} onClick={goNovoCurso}>{t('professor.cursos.adicionar')}</button>
            </div>

            {loading ? (
              <div style={{textAlign: 'center', padding: '30px 0', color: theme.textSub}}>{t('professor.comum.aCarregar')}</div>
            ) : cursosReais.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 20px', border: `2px dashed ${theme.inputBorder}`, borderRadius: '12px', backgroundColor: theme.inputBg}}>
                 <h3 style={{color: theme.textMain, margin: '0 0 5px 0', fontSize: '16px'}}>{t('professor.cursos.vazioTitulo')}</h3>
                 <p style={{color: theme.textSub, margin: 0, fontSize: '13px'}}>{t('professor.cursos.vazioTexto')}</p>
              </div>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t('professor.cursos.thTitulo')}</th>
                      <th style={styles.th}>{t('professor.cursos.thDificuldade')}</th>
                      <th style={styles.th}>{t('professor.comum.estado')}</th>
                      <th style={{...styles.th, textAlign: 'right'}}>{t('professor.comum.acoes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosReais.map(curso => (
                      <tr key={curso.id} style={{transition: 'background-color 0.2s', cursor: 'pointer', ':hover': { backgroundColor: theme.inputBg }}} onClick={() => setViewingCurso(curso)}>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{curso.titulo}</td>
                        <td style={styles.td}><span style={styles.levelBadge(curso.nivel)}>{curso.nivel || t('professor.cursos.nivelPadrao')}</span></td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge(curso.aprovado)}>
                            {curso.aprovado ? t('professor.comum.online') : t('professor.comum.pendente')}
                          </span>
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                            <button type="button" style={styles.viewButton} onClick={(e) => { e.stopPropagation(); setViewingCurso(curso); }}>{t('professor.comum.verDetalhes')}</button>
                            <button type="button" style={styles.deleteButton} onClick={(e) => handleDeleteCurso(e, curso.id)}>{t('professor.comum.apagar')}</button>
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
                <h2 style={styles.sectionTitle}>{t('professor.quizzes.titulo')}</h2>
                <p style={{color: theme.textSub, fontSize: '13px', margin: 0}}>{t('professor.quizzes.subtitulo')}</p>
              </div>
              <button type="button" style={{...styles.submitButton, backgroundColor: theme.warning, backgroundImage: 'none', boxShadow: `0 4px 10px ${theme.warning}50`}} onClick={goNovoQuiz}>{t('professor.quizzes.adicionar')}</button>
            </div>

            {loading ? (
              <div style={{textAlign: 'center', padding: '30px 0', color: theme.textSub}}>{t('professor.comum.aCarregar')}</div>
            ) : quizzesReais.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 20px', border: `2px dashed ${theme.inputBorder}`, borderRadius: '12px', backgroundColor: theme.inputBg}}>
                 <h3 style={{color: theme.textMain, margin: '0 0 5px 0', fontSize: '16px'}}>{t('professor.quizzes.vazioTitulo')}</h3>
                 <p style={{color: theme.textSub, margin: 0, fontSize: '13px'}}>{t('professor.quizzes.vazioTexto')}</p>
              </div>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t('professor.quizzes.thTitulo')}</th>
                      <th style={styles.th}>{t('professor.quizzes.thCurso')}</th>
                      <th style={styles.th}>{t('professor.quizzes.thPerguntas')}</th>
                      <th style={styles.th}>{t('professor.comum.estado')}</th>
                      <th style={{...styles.th, textAlign: 'right'}}>{t('professor.comum.acoes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzesReais.map((quiz) => (
                      <tr key={quiz.grupoId} style={{transition: 'background-color 0.2s', cursor: 'pointer', ':hover': { backgroundColor: theme.inputBg }}} onClick={() => setViewingQuiz(quiz)}>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{quiz.titulo}</td>
                        <td style={styles.td}><span style={{color: theme.primary, fontWeight: '600'}}>{quiz.nome_curso}</span></td>
                        <td style={styles.td}>{quiz.perguntas.length} {quiz.perguntas.length === 1 ? t('professor.quizzes.perguntaSingular') : t('professor.quizzes.perguntaPlural')}</td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge(quiz.aprovado)}>
                            {quiz.aprovado ? t('professor.comum.online') : t('professor.comum.pendente')}
                          </span>
                        </td>
                        <td style={{...styles.td, textAlign: 'right'}}>
                          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                            <button type="button" style={styles.viewButton} onClick={(e) => { e.stopPropagation(); setViewingQuiz(quiz); }}>{t('professor.comum.verDetalhes')}</button>
                            <button type="button" style={styles.deleteButton} onClick={(e) => handleDeleteQuiz(e, quiz)}>{t('professor.comum.apagar')}</button>
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
          <h2 style={styles.sectionTitle}>{editingCursoId ? t('professor.tabs.editarCurso') : t('professor.formCurso.tituloNovo')}</h2>
          <p style={{color: theme.textSub, fontSize: '13px', marginBottom: '20px'}}>{t('professor.formCurso.subtitulo')}</p>

          <form onSubmit={handleSubmitCurso}>
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px'}}>
              <div style={{...styles.inputWrapper, flex: '1 1 250px', marginBottom: 0}}>
                <label htmlFor="curso-titulo" style={styles.label}>{t('professor.formCurso.labelTitulo')}</label>
                <input id="curso-titulo" style={styles.input} type="text" name="titulo" value={cursoData.titulo} onChange={handleCursoChange} placeholder={t('professor.formCurso.placeholderTitulo')} required />
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 150px', marginBottom: 0}}>
                <label htmlFor="curso-nivel" style={styles.label}>{t('professor.formCurso.labelNivel')}</label>
                <select id="curso-nivel" style={styles.input} name="nivel" value={cursoData.nivel} onChange={handleCursoChange}>
                  <option value="iniciante">{t('professor.formCurso.nivelIniciante')}</option>
                  <option value="intermedio">{t('professor.formCurso.nivelIntermedio')}</option>
                  <option value="avancado">{t('professor.formCurso.nivelAvancado')}</option>
                </select>
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 100px', marginBottom: 0}}>
                <label htmlFor="curso-num-licoes" style={styles.label}>{t('professor.formCurso.labelNumLicoes')}</label>
                <select id="curso-num-licoes" style={{...styles.input, borderColor: theme.primary, fontWeight: 'bold'}} value={numeroLicoes} onChange={handleNumeroLicoesChange}>
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{backgroundColor: theme.inputBg, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}60`, marginBottom: '20px'}}>
              <div style={{...styles.inputWrapper, marginBottom: 0}}>
                <label htmlFor="curso-descricao" style={styles.label}>{t('professor.formCurso.labelDescricao')}</label>
                <textarea id="curso-descricao" style={{...styles.textarea, minHeight: '60px'}} name="descricao" value={cursoData.descricao} onChange={handleCursoChange} placeholder={t('professor.formCurso.placeholderDescricao')} required></textarea>
              </div>
            </div>

            {licoes.map((licaoTexto, index) => (
              <div key={index} style={{backgroundColor: theme.inputBg, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.primary}40`, marginBottom: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <h3 id={`conteudoLicao_${index}_label`} style={{margin: 0, color: theme.primary, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span aria-hidden="true" style={{backgroundColor: theme.primary, color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}>{index + 1}</span>
                    {t('professor.formCurso.conteudoLicao').replace('{n}', index + 1)}
                  </h3>

                  <button
                    type="button"
                    style={{...styles.editorBtn, backgroundColor: theme.primary, color: 'white', border: 'none'}}
                    onClick={() => insertTemplate(index)}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                  >
                    {t('professor.formCurso.layoutBase')}
                  </button>
                </div>

                <div style={styles.editorToolbar}>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<h2>', '</h2>')}>{t('professor.formCurso.h2')}</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<h3>', '</h3>')}>{t('professor.formCurso.h3')}</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<strong>', '</strong>')}>{t('professor.formCurso.negrito')}</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<p>', '</p>')}>{t('professor.formCurso.paragrafo')}</button>
                  <button type="button" style={styles.editorBtn} onClick={() => insertFormatting(index, '<ul>\n  <li>', '</li>\n</ul>')}>{t('professor.formCurso.lista')}</button>
                  <button type="button" style={{...styles.editorBtn, color: theme.warning, borderColor: `${theme.warning}50`}} onClick={() => insertFormatting(index, `<div style="padding: 15px; background-color: ${theme.cardBg}; border-left: 4px solid ${theme.primary}; border-radius: 4px; margin: 20px 0;">\n  <h4 style="color: ${theme.primary}; margin-top: 0;">ℹ️ Dica de Segurança</h4>\n  <p style="margin-bottom: 0;">`, '</p>\n</div>')}>{t('professor.formCurso.caixaDica')}</button>
                </div>

                <textarea
                  id={`conteudoLicao_${index}`}
                  aria-labelledby={`conteudoLicao_${index}_label`}
                  style={{...styles.textarea, minHeight: '200px', fontFamily: 'monospace', fontSize: '13px', border: `1px dashed ${theme.inputBorder}`}}
                  value={licaoTexto}
                  onChange={(e) => handleLicaoTextoChange(index, e.target.value)}
                  placeholder={t('professor.formCurso.placeholderLicao')}
                  required
                ></textarea>
              </div>
            ))}

            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '30px'}}>
              <button type="submit" style={styles.submitButton}>{editingCursoId ? t('professor.comum.guardarAlteracoes') : t('professor.formCurso.guardar')}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'createQuiz' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>{editingQuizTitulo ? t('professor.formQuiz.tituloEditar') : t('professor.formQuiz.tituloNovo')}</h2>
          <p style={{color: theme.textSub, fontSize: '13px', marginBottom: '20px'}}>{t('professor.formQuiz.subtitulo')}</p>

          <form onSubmit={handleSubmitQuiz}>
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', backgroundColor: theme.inputBg, padding: '20px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}60`, marginBottom: '20px'}}>
              <div style={{...styles.inputWrapper, flex: '1 1 200px', marginBottom: 0}}>
                <label htmlFor="quiz-titulo" style={styles.label}>{t('professor.formQuiz.labelTitulo')}</label>
                <input id="quiz-titulo" style={styles.input} type="text" name="titulo" value={quizMeta.titulo} onChange={handleQuizMetaChange} placeholder={t('professor.formQuiz.placeholderTitulo')} required />
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 200px', marginBottom: 0}}>
                <label htmlFor="quiz-nome-curso" style={styles.label}>{t('professor.formQuiz.labelCurso')}</label>
                <input id="quiz-nome-curso" style={styles.input} type="text" list="cursos-list" name="nome_curso" value={quizMeta.nome_curso} onChange={handleQuizMetaChange} placeholder={t('professor.formQuiz.placeholderCurso')} required autoComplete="off" />
                <datalist id="cursos-list">
                  {cursosReais.map(curso => (<option key={curso.id} value={curso.titulo} />))}
                </datalist>
              </div>
              <div style={{...styles.inputWrapper, flex: '1 1 100px', marginBottom: 0}}>
                <label htmlFor="quiz-num-perguntas" style={styles.label}>{t('professor.formQuiz.labelNumPerguntas')}</label>
                <select id="quiz-num-perguntas" style={{...styles.input, borderColor: theme.warning, fontWeight: 'bold'}} value={numeroPerguntas} onChange={handleNumeroPerguntasChange}>
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {perguntasQuiz.map((q, index) => (
              <div key={index} style={{ padding: '20px', borderRadius: '10px', border: `2px dashed ${theme.warning}50`, marginBottom: '20px', backgroundColor: theme.inputBg }}>
                <h4 id={`pergunta_${index}_label`} style={{color: theme.warning, margin: '0 0 15px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span aria-hidden="true" style={{backgroundColor: theme.warning, color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'}}>{index + 1}</span>
                  {t('professor.formQuiz.estruturaPergunta').replace('{n}', index + 1)}
                </h4>

                <input id={`pergunta_${index}`} aria-labelledby={`pergunta_${index}_label`} style={{...styles.input, marginBottom: '20px'}} type="text" value={q.pergunta} onChange={(e) => handlePerguntaChange(index, 'pergunta', e.target.value)} placeholder={t('professor.formQuiz.placeholderPergunta')} required />

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
                  <div style={{position: 'relative'}}>
                    <span aria-hidden="true" style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>A.</span>
                    <input id={`pergunta_${index}_opcao_a`} aria-label={t('professor.formQuiz.opcaoA')} style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_a} onChange={(e) => handlePerguntaChange(index, 'opcao_a', e.target.value)} placeholder={t('professor.formQuiz.opcaoA')} required />
                  </div>
                  <div style={{position: 'relative'}}>
                    <span aria-hidden="true" style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>B.</span>
                    <input id={`pergunta_${index}_opcao_b`} aria-label={t('professor.formQuiz.opcaoB')} style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_b} onChange={(e) => handlePerguntaChange(index, 'opcao_b', e.target.value)} placeholder={t('professor.formQuiz.opcaoB')} required />
                  </div>
                  <div style={{position: 'relative'}}>
                    <span aria-hidden="true" style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>C.</span>
                    <input id={`pergunta_${index}_opcao_c`} aria-label={t('professor.formQuiz.opcaoC')} style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_c} onChange={(e) => handlePerguntaChange(index, 'opcao_c', e.target.value)} placeholder={t('professor.formQuiz.opcaoC')} />
                  </div>
                  <div style={{position: 'relative'}}>
                    <span aria-hidden="true" style={{position: 'absolute', top: '13px', left: '14px', fontWeight: 'bold', color: theme.textSub, fontSize: '14px'}}>D.</span>
                    <input id={`pergunta_${index}_opcao_d`} aria-label={t('professor.formQuiz.opcaoD')} style={{...styles.input, paddingLeft: '40px'}} type="text" value={q.opcao_d} onChange={(e) => handlePerguntaChange(index, 'opcao_d', e.target.value)} placeholder={t('professor.formQuiz.opcaoD')} />
                  </div>
                </div>

                <div style={{marginTop: '20px', padding: '12px 18px', backgroundColor: `${theme.warning}15`, borderRadius: '8px', display: 'inline-block'}}>
                  <label htmlFor={`pergunta_${index}_resposta`} style={{...styles.label, display: 'inline', marginRight: '12px', color: theme.warning}}>{t('professor.formQuiz.opcaoCerta')}</label>
                  <select id={`pergunta_${index}_resposta`} style={{...styles.input, width: 'auto', padding: '8px 16px', display: 'inline-block', borderColor: theme.warning, color: theme.textMain, fontWeight: 'bold'}} value={q.resposta_correta} onChange={(e) => handlePerguntaChange(index, 'resposta_correta', e.target.value)} required>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
              </div>
            ))}

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button type="submit" style={{...styles.submitButton, backgroundColor: theme.warning, backgroundImage: 'none', boxShadow: `0 4px 10px ${theme.warning}50`}}>{editingQuizTitulo ? t('professor.comum.guardarAlteracoes') : t('professor.formQuiz.guardar')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
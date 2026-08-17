import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useTranslation } from '../i18n';

export default function Cursos({ setView, theme, setActiveCourse }) {
  const t = useTranslation();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  // Guarda a chave i18n do erro (traduzida no render, para reagir à mudança de idioma)
  const [erro, setErro] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    buscarCursos();
  }, []);

  const buscarCursos = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await apiFetch('/cursos');
      if (response.ok) {
        const data = await response.json();
        setCursos(data);
      } else {
        setErro('aluno.comum.erroCarregar');
      }
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      setErro('aluno.comum.erroCarregar');
    } finally {
      setLoading(false);
    }
  };

  const contarLicoes = (conteudoJSON) => {
    try {
      const parsed = JSON.parse(conteudoJSON);
      if (Array.isArray(parsed)) return parsed.length;
      return 1;
    } catch {
      return 1; 
    }
  };

  const getGradient = (nivel) => {
    const n = String(nivel).toLowerCase();
    if (n === 'avancado') return 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)';
    if (n === 'intermedio') return 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
    return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'; // Iniciante
  };

  const termo = searchTerm.toLowerCase();
  const cursosFiltrados = cursos.filter(curso =>
    (curso.titulo || '').toLowerCase().includes(termo) ||
    (curso.descricao || '').toLowerCase().includes(termo)
  );

  const styles = {
    // Largura total, sem limite de ecrã e margens de topo reduzidas
    container: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', animation: 'fadeIn 0.4s ease' },
    
    // Grelha ajustável automaticamente
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
    
    // O cartão é um <button> (acessibilidade): repõe os defaults do browser sem alterar o visual
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}40`, display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', cursor: 'pointer', height: '100%', width: '100%', padding: 0, textAlign: 'left', font: 'inherit' },
    
    imagePlaceholder: (nivel) => ({ 
      height: '160px', 
      background: getGradient(nivel), 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      color: 'rgba(255,255,255,0.8)', 
      position: 'relative'
    }),
    
    badgeNivelAbsoluto: (nivel) => {
      const color = nivel === 'avancado' ? '#ef4444' : nivel === 'intermedio' ? '#f59e0b' : '#10b981';
      return { position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: color, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', border: `1px solid ${color}50` };
    },
    
    cardBody: { padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 },
    courseTitle: { fontSize: '18px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 12px 0', lineHeight: '1.4' },
    
    metaRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '16px', flexWrap: 'wrap' },
    metaItem: { fontSize: '12px', color: theme.textSub, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', backgroundColor: theme.inputBg, padding: '4px 8px', borderRadius: '6px' },
    
    courseDesc: { fontSize: '14px', color: theme.textSub, margin: '0 0 24px 0', lineHeight: '1.6', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }, // Corta o texto em 3 linhas
    
    // boxSizing explícito: este elemento é agora um <span> (content-box por defeito) e não um <button>
    button: { width: '100%', boxSizing: 'border-box', padding: '14px', backgroundImage: theme.gradient, backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 14px ${theme.primary}45`, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },

    searchInput: { width: '100%', maxWidth: '420px', padding: '12px 16px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg, color: theme.inputText, fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  };

  return (
    <div style={styles.container}>

      {!loading && cursos.length > 0 && (
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('aluno.cursos.pesquisarPlaceholder')}
          aria-label={t('aluno.cursos.pesquisar')}
          style={styles.searchInput}
        />
      )}

      {loading ? (
        <div style={{textAlign: 'center', padding: '60px', color: theme.textSub, fontWeight: 'bold'}}>
           <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginBottom: '15px', animation: 'spin 2s linear infinite'}}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
           <br/>{t('aluno.cursos.aCarregar')}
        </div>
      ) : erro ? (
        // Falha de rede/servidor: mostra erro com retry em vez de um catálogo vazio.
        <div style={{textAlign: 'center', padding: '80px 20px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `2px dashed ${theme.inputBorder}`}}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }} aria-hidden="true">⚠️</div>
          <p style={{color: theme.textMain, fontWeight: 'bold', margin: '0 0 16px 0'}}>{t(erro)}</p>
          <button type="button" className="cl-btn cl-btn-primary" onClick={buscarCursos}>
            {t('aluno.comum.tentarNovamente')}
          </button>
        </div>
      ) : cursos.length === 0 ? (
        <div style={{textAlign: 'center', padding: '80px 20px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `2px dashed ${theme.inputBorder}`}}>
          <div style={{ backgroundColor: theme.inputBg, width: '70px', height: '70px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto', color: theme.textSub }}>
             <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3 style={{color: theme.textMain, margin: '0 0 10px 0', fontSize: '18px'}}>{t('aluno.cursos.vazioTitulo')}</h3>
          <p style={{color: theme.textSub, fontSize: '14px', margin: 0}}>{t('aluno.cursos.vazioTexto')}</p>
        </div>
      ) : cursosFiltrados.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px 20px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.inputBorder}`}}>
          <h3 style={{color: theme.textMain, margin: '0 0 8px 0', fontSize: '18px'}}>{t('aluno.cursos.semResultadosTitulo')}</h3>
          <p style={{color: theme.textSub, fontSize: '14px', margin: 0}}>{t('aluno.cursos.semResultadosTexto')}</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {cursosFiltrados.map(curso => {
            const numLicoes = contarLicoes(curso.conteudo_licao);
            
            return (
              // Cartão clicável como <button> (acessibilidade por teclado/leitores de ecrã).
              // O antigo botão interno passou a <span> visual — <button> dentro de <button> é HTML inválido.
              <button
                type="button"
                key={curso.id}
                style={styles.card}
                onClick={() => {
                  setActiveCourse(curso);
                  setView('licao');
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.2)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow; }}
              >
                <div style={styles.imagePlaceholder(curso.nivel)}>
                  <span style={styles.badgeNivelAbsoluto(curso.nivel)}>{curso.nivel || t('aluno.cursos.nivelPadrao')}</span>
                  <svg aria-hidden="true" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>

                <div style={styles.cardBody}>
                  <h3 style={styles.courseTitle}>{curso.titulo}</h3>

                  <div style={styles.metaRow}>
                    <span style={styles.metaItem}>
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {t('aluno.cursos.prof')} {curso.nome_professor || t('aluno.cursos.profDesconhecido')}
                    </span>
                    <span style={styles.metaItem}>
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      {numLicoes} {numLicoes === 1 ? t('aluno.cursos.licaoSingular') : t('aluno.cursos.licaoPlural')}
                    </span>
                  </div>

                  <p style={styles.courseDesc} title={curso.descricao}>{curso.descricao}</p>

                  <span
                    style={styles.button}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {t('aluno.cursos.iniciar')}
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
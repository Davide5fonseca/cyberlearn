import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useUI } from './ui/UIProvider';
import { useTranslation } from '../i18n';

export default function AdminAprovacoes({ theme }) {
  const t = useTranslation();
  const { notify, confirm } = useUI();
  const [pendentes, setPendentes] = useState({ cursos: [], quizzes: [], professores: [] });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false); // falha de rede ou resposta !ok

  useEffect(() => {
    buscarPendentes();
  }, []);

  const buscarPendentes = async () => {
    setLoading(true);
    setErro(false);
    try {
      const res = await apiFetch('/admin/pendentes');
      if (res.ok) {
        const data = await res.json();
        setPendentes({ cursos: data.cursos || [], quizzes: data.quizzes || [], professores: data.professores || [] });
      } else {
        setErro(true);
      }
    } catch (err) {
      console.error(err);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  const LABELS = { quiz: t('adminx.tipoQuiz'), curso: t('adminx.tipoCurso'), professor: t('adminx.tipoProfessor') };

  const handleAprovar = async (tipo, identificador) => {
    try {
      // Cursos, quizzes e professores são identificados por id numérico.
      const res = await apiFetch(`/admin/aprovar/${tipo}/${identificador}`, { method: 'PUT' });

      if (res.ok) { notify(t('adminx.aprAprovadoOk').replace('{tipo}', LABELS[tipo]), 'success'); buscarPendentes(); }
      else notify(t('adminx.aprAprovarFalha'), 'error');
    } catch (err) {
      console.error(err);
      notify(t('adminx.connError'), 'error');
    }
  };

  const handleRejeitar = async (tipo, identificador) => {
    if (!(await confirm({ title: t('adminx.aprRejConfirmTitle'), message: t('adminx.aprRejConfirmMsg').replace('{tipo}', LABELS[tipo]), confirmLabel: t('adminx.aprRejeitar'), danger: true }))) return;
    try {
      const res = await apiFetch(`/admin/rejeitar/${tipo}/${identificador}`, { method: 'DELETE' });

      if (res.ok) { notify(t('adminx.aprRejeitadoOk').replace('{tipo}', LABELS[tipo]), 'success'); buscarPendentes(); }
      else notify(t('adminx.aprRejeitarFalha'), 'error');
    } catch (err) {
      console.error(err);
      notify(t('adminx.connError'), 'error');
    }
  };

  const styles = {
    container: { width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}` },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: '0 0 16px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: theme.inputBg, borderRadius: '12px', border: `1px solid ${theme.inputBorder}50`, marginBottom: '12px', gap: '16px', flexWrap: 'wrap', transition: 'all 0.2s', ':hover': { borderColor: theme.primary } },
    btnAprovar: { backgroundColor: theme.success || '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' },
    btnRejeitar: { backgroundColor: 'transparent', color: theme.danger || '#ef4444', border: `1px solid ${theme.danger}50`, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s' }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '40px', color: theme.textSub}}>{t('adminx.aprLoading')}</div>;

  // Bloco de erro com o mesmo visual dos estados vazios + botão de repetir
  if (erro) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ backgroundColor: theme.inputBg, padding: '30px', borderRadius: '12px', textAlign: 'center', color: theme.textSub, fontSize: '14px', border: `1px dashed ${theme.inputBorder}` }}>
          <p style={{ margin: 0, color: theme.danger, fontWeight: 'bold' }}>{t('adminx.loadError')}</p>
          <button
            type="button"
            onClick={buscarPendentes}
            style={{ backgroundColor: theme.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '12px' }}
          >
            {t('adminx.retry')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* SECÇÃO PROFESSORES */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.success || '#10b981'} strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
          {t('adminx.aprProfsTitle')} ({pendentes.professores.length})
        </h2>
        {pendentes.professores.length === 0 ? (
          <div style={{ backgroundColor: theme.inputBg, padding: '20px', borderRadius: '12px', textAlign: 'center', color: theme.textSub, fontSize: '14px', border: `1px dashed ${theme.inputBorder}` }}>
            {t('adminx.aprProfsEmpty')}
          </div>
        ) : (
          pendentes.professores.map(prof => (
            <div key={prof.id} style={styles.itemRow} onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.success}50`} onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.inputBorder}50`}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.textMain }}>{prof.nome}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textSub }}>{prof.email} • {t('adminx.aprMetaRegisto')}: {prof.data_registo}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  style={styles.btnRejeitar}
                  onClick={() => handleRejeitar('professor', prof.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  {t('adminx.aprRejeitar')}
                </button>
                <button
                  style={styles.btnAprovar}
                  onClick={() => handleAprovar('professor', prof.id)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {t('adminx.aprAprovarConta')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SECÇÃO CURSOS */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
          {t('adminx.aprCursosTitle')} ({pendentes.cursos.length})
        </h2>
        {pendentes.cursos.length === 0 ? (
          <div style={{ backgroundColor: theme.inputBg, padding: '20px', borderRadius: '12px', textAlign: 'center', color: theme.textSub, fontSize: '14px', border: `1px dashed ${theme.inputBorder}` }}>
            {t('adminx.aprCursosEmpty')}
          </div>
        ) : (
          pendentes.cursos.map(curso => (
            <div key={curso.id} style={styles.itemRow} onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.primary}50`} onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.inputBorder}50`}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.textMain }}>{curso.titulo}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textSub }}>{t('adminx.aprMetaProf')}: <strong>{curso.nome_professor}</strong> • {t('adminx.aprMetaNivel')}: <span style={{ textTransform: 'capitalize' }}>{curso.nivel}</span></p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={styles.btnRejeitar} 
                  onClick={() => handleRejeitar('curso', curso.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  {t('adminx.aprRejeitar')}
                </button>
                <button 
                  style={styles.btnAprovar} 
                  onClick={() => handleAprovar('curso', curso.id)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {t('adminx.aprAprovarCurso')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SECÇÃO QUIZZES */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.warning || '#f59e0b'} strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          {t('adminx.aprQuizzesTitle')} ({pendentes.quizzes.length})
        </h2>
        {pendentes.quizzes.length === 0 ? (
          <div style={{ backgroundColor: theme.inputBg, padding: '20px', borderRadius: '12px', textAlign: 'center', color: theme.textSub, fontSize: '14px', border: `1px dashed ${theme.inputBorder}` }}>
            {t('adminx.aprQuizzesEmpty')}
          </div>
        ) : (
          pendentes.quizzes.map((quiz) => (
            <div key={quiz.grupo_id} style={styles.itemRow} onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.warning}50`} onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.inputBorder}50`}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.textMain }}>{quiz.titulo}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textSub }}>{t('adminx.aprMetaCurso')}: <strong>{quiz.nome_curso}</strong> • {t('adminx.aprMetaProf')}: <strong>{quiz.nome_professor}</strong> • {quiz.num_perguntas} {t('adminx.aprMetaPerguntas')}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  style={styles.btnRejeitar} 
                  onClick={() => handleRejeitar('quiz', quiz.grupo_id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  {t('adminx.aprRejeitar')}
                </button>
                <button 
                  style={{ ...styles.btnAprovar, backgroundColor: theme.warning || '#f59e0b', color: '#fff' }} 
                  onClick={() => handleAprovar('quiz', quiz.grupo_id)}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {t('adminx.aprAprovarQuiz')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
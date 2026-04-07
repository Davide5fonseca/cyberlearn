import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Dashboard({ theme, user, setView }) {
  const [trofeus, setTrofeus] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      buscarDadosReais();
    }
  }, [user]);

  const buscarDadosReais = async () => {
    setLoading(true);
    try {
      const resTrofeus = await apiFetch(`/conquistas/${user.id}`);
      if (resTrofeus.ok) setTrofeus(await resTrofeus.json());

      const resStats = await apiFetch(`/estatisticas/aluno/${user.id}`);
      if (resStats.ok) {
        setDashboardData(await resStats.json());
      }
    } catch (err) {
      console.error("Erro a buscar dados do Dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '20px', animation: 'fadeIn 0.4s ease' },
    
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
    statCard: { backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${theme.inputBorder}` },
    statIconBox: (color) => ({ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
    
    statNumber: { fontSize: '24px', fontWeight: '800', color: theme.textMain, margin: 0, lineHeight: '1.1' },
    statLabel: { fontSize: '11px', color: theme.textSub, textTransform: 'uppercase', marginTop: '4px', fontWeight: '700', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
    
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    
    heroCard: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', backgroundImage: `linear-gradient(to right, ${theme.cardBg}, ${theme.inputBg})` },
    heroTitle: { fontSize: '20px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 8px 0' },
    heroSubtitle: { fontSize: '14px', color: theme.textSub, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' },
    heroButton: { backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: `0 4px 12px ${theme.primary}40` },
    
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    courseCard: { backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
    courseImagePlaceholder: (color) => ({ width: '100%', height: '120px', backgroundColor: `${color}10`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: color, borderBottom: `1px solid ${theme.inputBorder}` }),
    courseContent: { padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' },
    courseTitle: { fontSize: '16px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 6px 0', lineHeight: '1.4' },
    courseModule: { fontSize: '13px', color: theme.textSub, margin: '0 0 20px 0' },
    progressBarContainer: { width: '100%', height: '8px', backgroundColor: theme.inputBg, borderRadius: '4px', overflow: 'hidden', marginTop: '5px' },
    progressBar: (progress, color) => ({ width: `${progress}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }),
    progressText: { fontSize: '12px', fontWeight: 'bold', color: theme.textMain, marginTop: '8px', textAlign: 'right' },

    trofeusGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
    trofeuCard: { backgroundColor: theme.inputBg, border: `1px solid ${theme.warning}50`, borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden', boxShadow: theme.shadow },
    iconeTrofeu: { fontSize: '40px', marginBottom: '10px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' },
    nomeTrofeu: { color: theme.warning, fontWeight: 'bold', fontSize: '15px', margin: '0 0 5px 0' },
    descTrofeu: { color: theme.textSub, fontSize: '12px', margin: '0 0 10px 0', lineHeight: '1.4' },
    dataTrofeu: { color: theme.textMain, fontSize: '10px', backgroundColor: `${theme.warning}20`, padding: '4px 8px', borderRadius: '10px', fontWeight: 'bold' }
  };

  if (loading || !dashboardData) {
    return <div style={{textAlign: 'center', padding: '60px', color: theme.textSub}}>A carregar o teu progresso da base de dados...</div>;
  }

  const { stats, cursoDestaque, cursosAtivos } = dashboardData;

  const getRank = (xp) => {
    if (xp >= 2500) return { titulo: 'CISO', cor: '#ef4444' }; 
    if (xp >= 1200) return { titulo: 'Ethical Hacker', cor: '#8b5cf6' }; 
    if (xp >= 600) return { titulo: 'Analista Júnior', cor: '#3b82f6' }; 
    if (xp >= 250) return { titulo: 'Explorador', cor: '#10b981' }; 
    return { titulo: 'Script Kiddie', cor: theme.textSub }; 
  };

  const rank = getRank(stats.pontuacaoTotal);

  return (
    <div style={styles.container}>
      
      {/* 1. MÉTRICAS REAIS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconBox(theme.success)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div style={{minWidth: 0}}>
            <h3 style={styles.statNumber}>{stats.modulosConcluidos}</h3>
            <p style={styles.statLabel}>Cursos Lidos</p>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIconBox(theme.primary)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          </div>
          <div style={{minWidth: 0}}>
            <h3 style={styles.statNumber}>{stats.taxaAcerto}%</h3>
            <p style={styles.statLabel}>Acerto nos Quizzes</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconBox(rank.cor)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <div style={{minWidth: 0}}>
            <h3 style={styles.statNumber}>{stats.pontuacaoTotal}</h3>
            <p style={styles.statLabel}>Pontos XP</p>
            <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: `${rank.cor}20`, color: rank.cor, padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
              Rank: {rank.titulo}
            </span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconBox(theme.warning)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19c-1.5-2-3.5-3-5.5-3-2 0-4 1-5.5 3"></path><path d="M12 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path></svg>
          </div>
          <div style={{minWidth: 0}}>
            <h3 style={styles.statNumber}>{stats.diasSeguidos}</h3>
            <p style={styles.statLabel}>Dias Seguidos 🔥</p>
          </div>
        </div>

      </div>

      {/* 2. VITRINA DE TROFÉUS */}
      <div>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.warning} strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
            A Minha Vitrina de Troféus
          </h2>
        </div>
        
        {trofeus.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: theme.textSub, backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px dashed ${theme.inputBorder}`}}>
            Ainda não conquistaste nenhum troféu. Resolve um Quiz para ganhares a tua primeira recompensa! 🏆
          </div>
        ) : (
          <div style={styles.trofeusGrid}>
            {trofeus.map((t, i) => (
              <div key={i} style={styles.trofeuCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{position: 'absolute', top: '-20px', right: '-20px', width: '60px', height: '60px', backgroundColor: `${theme.warning}10`, borderRadius: '50%'}}></div>
                <span style={styles.iconeTrofeu}>{t.icone}</span>
                <h3 style={styles.nomeTrofeu}>{t.nome}</h3>
                <p style={styles.descTrofeu}>{t.descricao}</p>
                <span style={styles.dataTrofeu}>Desbloqueado a {t.data}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. CURSO EM DESTAQUE */}
      {cursoDestaque && (
        <div>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Continuar a Aprender
            </h2>
          </div>
          
          <div style={styles.heroCard}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h3 style={styles.heroTitle}>{cursoDestaque.titulo}</h3>
              <p style={styles.heroSubtitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                {cursoDestaque.moduloAtual}
              </p>
              <div style={{ marginTop: '15px', maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.textSub, marginBottom: '4px', fontWeight: 'bold' }}>
                  <span>Progresso</span>
                  <span>{cursoDestaque.progresso}%</span>
                </div>
                <div style={styles.progressBarContainer}>
                  <div style={styles.progressBar(cursoDestaque.progresso, theme.primary)}></div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: theme.textSub, fontWeight: '600', backgroundColor: theme.inputBg, padding: '4px 10px', borderRadius: '12px' }}>
                ⏳ {cursoDestaque.tempoRestante}
              </span>
              <button 
                style={styles.heroButton}
                onClick={() => setView('cursos')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${theme.primary}60`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}40`; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Ver Curso
              </button>
            </div>
          </div>
        </div>
      )}

      {cursosAtivos && cursosAtivos.length > 0 && (
        <div>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.textMain} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Os Teus Cursos Ativos
            </h2>
          </div>
          
          <div style={styles.courseGrid}>
            {cursosAtivos.map(curso => (
              <div 
                key={curso.id} 
                style={styles.courseCard}
                onClick={() => setView('cursos')} /* ONCLICK ADICIONADO AQUI! */
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.15)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow; }}
              >
                <div style={styles.courseImagePlaceholder(curso.cor)}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                
                <div style={styles.courseContent}>
                  <div>
                    <h4 style={styles.courseTitle}>{curso.titulo}</h4>
                    <p style={styles.courseModule}>{curso.modulo}</p>
                  </div>
                  
                  <div>
                    <div style={styles.progressBarContainer}>
                      <div style={styles.progressBar(curso.progresso, curso.cor)}></div>
                    </div>
                    <p style={styles.progressText}>{curso.progresso}% Concluído</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
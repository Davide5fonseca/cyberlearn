import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function Dashboard({ theme, user, setView }) {
  const [trofeus, setTrofeus] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [classificacao, setClassificacao] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Calendário
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

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
      if (resStats.ok) setDashboardData(await resStats.json());

      const resClassificacao = await apiFetch('/classificacao');
      if (resClassificacao.ok) {
        const dataClass = await resClassificacao.json();
        if (Array.isArray(dataClass)) setClassificacao(dataClass);
      }

      const resAtividades = await apiFetch(`/estatisticas/aluno/${user.id}/atividades`);
      if (resAtividades.ok) {
        const dataAtiv = await resAtividades.json();
        if (Array.isArray(dataAtiv)) setAtividades(dataAtiv);
      }

    } catch (err) {
      console.error("Erro a buscar dados do Dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const getRank = (xp) => {
    const pontos = xp || 0;
    if (pontos >= 2500) return { titulo: 'CISO', cor: '#ef4444' }; 
    if (pontos >= 1200) return { titulo: 'Ethical Hacker', cor: '#8b5cf6' }; 
    if (pontos >= 600) return { titulo: 'Analista Júnior', cor: '#3b82f6' }; 
    if (pontos >= 250) return { titulo: 'Explorador', cor: '#10b981' }; 
    return { titulo: 'Script Kiddie', cor: theme.textSub || '#888' }; 
  };

  // Lógica do Calendário (Protegida)
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay(); 
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);
  const espacosVazios = Array.from({ length: primeiroDia }, (_, i) => i);
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const mudarMes = (direcao) => {
    setDiaSelecionado(null);
    if (direcao === 'ant') {
      if (mesAtual === 0) { setMesAtual(11); setAnoAtual(anoAtual - 1); } 
      else setMesAtual(mesAtual - 1);
    } else {
      if (mesAtual === 11) { setMesAtual(0); setAnoAtual(anoAtual + 1); } 
      else setMesAtual(mesAtual + 1);
    }
  };

  const getAtividadesDoDia = (dia) => {
    const dataStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return atividades.filter(a => a?.data === dataStr);
  };

  // Cores de segurança caso o tema falhe
  const colorSuccess = theme.success || theme.secondary || '#10b981';
  const colorWarning = theme.warning || '#f59e0b';
  const colorPrimary = theme.primary || '#3b82f6';

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px', animation: 'fadeIn 0.5s ease' },
    mainGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' },
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column' },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: '0 0 20px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '16px', backgroundColor: theme.cardBg, border: `1px solid ${theme.inputBorder}`, boxShadow: theme.shadow },
    statNumber: { fontSize: '28px', fontWeight: '800', color: theme.textMain, margin: 0, lineHeight: '1' },
    statLabel: { fontSize: '12px', color: theme.textSub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
    calHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    calBtn: { background: 'none', border: `1px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: theme.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' },
    calDayName: { fontSize: '12px', fontWeight: 'bold', color: theme.textSub, paddingBottom: '10px' },
    calDayBox: (temAtividade, isHoje, isSelecionado) => ({
      aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
      backgroundColor: isSelecionado ? colorPrimary : (temAtividade ? `${colorSuccess}20` : theme.inputBg),
      color: isSelecionado ? '#fff' : (temAtividade ? colorSuccess : theme.textMain),
      border: isHoje ? `2px solid ${colorPrimary}` : '2px solid transparent',
      transition: 'all 0.2s ease', position: 'relative'
    }),
    calTooltip: { marginTop: '15px', padding: '15px', backgroundColor: theme.inputBg, borderRadius: '12px', border: `1px solid ${theme.inputBorder}`, fontSize: '13px', color: theme.textMain },
    leaderboardItem: (isCurrentUser, index) => ({ display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: isCurrentUser ? `${colorPrimary}15` : (index % 2 === 0 ? theme.inputBg : 'transparent'), borderRadius: '12px', marginBottom: '8px', border: isCurrentUser ? `1px solid ${colorPrimary}50` : '1px solid transparent' }),
    leaderboardRank: (rank) => ({ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', backgroundColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : theme.inputBorder, color: rank <= 3 ? '#fff' : theme.textSub }),
    trofeusGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
    trofeuCard: { backgroundColor: theme.inputBg, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: `1px solid ${colorWarning}40` },
  };

  // Previne o ecrã preto se os dados ainda não estiverem carregados
  if (loading || !dashboardData || !dashboardData.stats) {
    return <div style={{textAlign: 'center', padding: '60px', color: theme.textSub}}>A preparar a tua Dashboard...</div>;
  }

  const { stats } = dashboardData;
  const rank = getRank(stats?.pontuacaoTotal);
  const primeiroNome = (user?.nome || 'Aluno').split(' ')[0];

  return (
    <div style={styles.container}>
      {/* 4 ESTATÍSTICAS PRINCIPAIS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{width: '50px', height: '50px', borderRadius: '12px', backgroundColor: `${colorSuccess}15`, color: colorSuccess, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3 style={styles.statNumber}>{stats.modulosConcluidos || 0}</h3>
          <p style={styles.statLabel}>Módulos Lidos</p>
        </div>
        
        <div style={styles.statCard}>
          <div style={{width: '50px', height: '50px', borderRadius: '12px', backgroundColor: `${colorPrimary}15`, color: colorPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          </div>
          <h3 style={styles.statNumber}>{stats.taxaAcerto || 0}%</h3>
          <p style={styles.statLabel}>Precisão Global</p>
        </div>

        <div style={styles.statCard}>
          <div style={{width: '50px', height: '50px', borderRadius: '12px', backgroundColor: `${rank.cor}15`, color: rank.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <h3 style={styles.statNumber}>{stats.pontuacaoTotal || 0}</h3>
          <p style={styles.statLabel}>Pontos XP</p>
        </div>

        <div style={styles.statCard}>
          <div style={{width: '50px', height: '50px', borderRadius: '12px', backgroundColor: `${colorWarning}15`, color: colorWarning, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19c-1.5-2-3.5-3-5.5-3-2 0-4 1-5.5 3"></path><path d="M12 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path></svg>
          </div>
          <h3 style={styles.statNumber}>{stats.diasSeguidos || 0}</h3>
          <p style={styles.statLabel}>Dias Seguidos 🔥</p>
        </div>
      </div>

      {/* GRELHA PRINCIPAL (Esquerda: Calendário | Direita: Leaderboard & Troféus) */}
      <div style={styles.mainGrid}>
        
        {/* COLUNA ESQUERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CALENDÁRIO DE ATIVIDADES */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colorPrimary} strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Calendário de Progresso
            </h2>
            
            <div style={styles.calHeader}>
              <button style={styles.calBtn} onClick={() => mudarMes('ant')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: theme.textMain }}>{nomesMeses[mesAtual]} {anoAtual}</h3>
              <button style={styles.calBtn} onClick={() => mudarMes('seg')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div style={styles.calGrid}>
              {nomesDias.map(dia => (
                <div key={dia} style={styles.calDayName}>{dia}</div>
              ))}
              
              {espacosVazios.map(v => <div key={`vazio-${v}`} />)}
              
              {dias.map(dia => {
                const ativs = getAtividadesDoDia(dia);
                const isHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
                const isSelecionado = diaSelecionado === dia;

                return (
                  <div 
                    key={dia} 
                    style={styles.calDayBox(ativs.length > 0, isHoje, isSelecionado)}
                    onClick={() => setDiaSelecionado(isSelecionado ? null : dia)}
                  >
                    {dia}
                    {ativs.length > 0 && !isSelecionado && (
                      <span style={{ position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: colorSuccess }}></span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tooltip do dia selecionado */}
            {diaSelecionado && (
              <div style={styles.calTooltip}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>{diaSelecionado} de {nomesMeses[mesAtual]}</p>
                {getAtividadesDoDia(diaSelecionado).length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {getAtividadesDoDia(diaSelecionado).map((a, i) => (
                      <li key={i}>Completaste um(a) <b>{a.tipo}</b>: {a.titulo}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: theme.textSub }}>Nenhuma atividade registada neste dia.</p>
                )}
              </div>
            )}
          </div>
          
        </div>

        {/* COLUNA DIREITA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TABELA DE CLASSIFICAÇÃO */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colorPrimary} strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Tabela de Classificação
            </h2>
            <div style={{ overflowY: 'auto', maxHeight: '350px', paddingRight: '5px' }}>
              {classificacao.length === 0 ? (
                <p style={{textAlign: 'center', color: theme.textSub}}>Ainda não há alunos na tabela.</p>
              ) : (
                classificacao.map((aluno, index) => {
                  const isTu = aluno.id === user?.id;
                  const inicial = (aluno.nome || 'U').charAt(0).toUpperCase();
                  
                  return (
                    <div key={aluno.id} style={styles.leaderboardItem(isTu, index)}>
                      <div style={styles.leaderboardRank(index + 1)}>{index + 1}</div>
                      <div style={{...styles.leaderboardRank(0), marginLeft: '12px', backgroundColor: colorPrimary, color: '#fff', fontSize: '12px', overflow: 'hidden'}}>
                         {aluno.avatar ? <img src={aluno.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : inicial}
                      </div>
                      <span style={{ marginLeft: '12px', fontWeight: '600', color: theme.textMain, flex: 1, fontSize: '14px' }}>
                        {aluno.nome} {isTu && <span style={{ color: colorPrimary, fontSize: '12px' }}>(Tu)</span>}
                      </span>
                      <span style={{ fontWeight: '800', color: theme.textMain, fontSize: '13px' }}>{aluno.xp_total || 0} XP</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* VITRINA DE TROFÉUS */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{...styles.sectionTitle, margin: 0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colorWarning} strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                Troféus
              </h2>
            </div>
            
            {trofeus.length === 0 ? (
              <p style={{textAlign: 'center', color: theme.textSub, fontSize: '13px'}}>Ainda não conquistaste nenhum troféu. Completa um quiz!</p>
            ) : (
              <div style={styles.trofeusGrid}>
                {trofeus.slice(0, 4).map((t, i) => (
                  <div key={i} style={styles.trofeuCard}>
                    <span style={{ fontSize: '28px', marginBottom: '8px' }}>{t.icone}</span>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: theme.textMain }}>{t.nome}</h3>
                    <span style={{ fontSize: '10px', color: theme.textSub, fontWeight: 'bold' }}>{t.data}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
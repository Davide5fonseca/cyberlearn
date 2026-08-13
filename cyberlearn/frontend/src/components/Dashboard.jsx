import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { StatCard } from './ui/primitives';

export default function Dashboard({ theme, user }) {
  const [trofeus, setTrofeus] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [classificacao, setClassificacao] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendário
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  // Modais
  const [leaderboardExpandido, setLeaderboardExpandido] = useState(false);
  const [trofeusExpandido, setTrofeusExpandido] = useState(false);
  
  // Estado para controlar qual troféu está aberto (para ler a descrição)
  const [trofeuAtivoDescricao, setTrofeuAtivoDescricao] = useState(null);

  useEffect(() => {
    if (user?.id) buscarDadosReais();
  }, [user]);

  const buscarDadosReais = async () => {
    setLoading(true);
    try {
      const [resTrofeus, resStats, resClass, resAtiv] = await Promise.all([
        apiFetch(`/conquistas/${user.id}`),
        apiFetch(`/estatisticas/aluno/${user.id}`),
        apiFetch('/classificacao'),
        apiFetch(`/estatisticas/aluno/${user.id}/atividades`),
      ]);
      if (resTrofeus.ok) setTrofeus(await resTrofeus.json());
      if (resStats.ok)   setDashboardData(await resStats.json());
      if (resClass.ok)   { const d = await resClass.json(); if (Array.isArray(d)) setClassificacao(d); }
      if (resAtiv.ok)    { const d = await resAtiv.json();  if (Array.isArray(d)) setAtividades(d); }
    } catch (err) {
      console.error('Erro a buscar dados do Dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const getRank = (xp) => {
    const p = xp || 0;
    if (p >= 2500) return { titulo: 'CISO',           cor: '#ef4444' };
    if (p >= 1200) return { titulo: 'Ethical Hacker', cor: '#8b5cf6' };
    if (p >=  600) return { titulo: 'Analista Júnior', cor: '#3b82f6' };
    if (p >=  250) return { titulo: 'Explorador',     cor: '#10b981' };
    return               { titulo: 'Script Kiddie',   cor: theme.textSub || '#888' };
  };

  // ── Calendário ─────────────────────────────────────────────────────
  const diasNoMes   = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const dias         = Array.from({ length: diasNoMes }, (_, i) => i + 1);
  const espacosVazios = Array.from({ length: primeiroDia });
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DIAS_SEMANA = ['D','S','T','Q','Q','S','S'];

  const mudarMes = (dir) => {
    setDiaSelecionado(null);
    if (dir === -1) {
      if (mesAtual === 0) { setMesAtual(11); setAnoAtual(y => y - 1); }
      else setMesAtual(m => m - 1);
    } else {
      if (mesAtual === 11) { setMesAtual(0); setAnoAtual(y => y + 1); }
      else setMesAtual(m => m + 1);
    }
  };

  const getAtivsDia = (dia) => {
    const s = `${anoAtual}-${String(mesAtual + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    return atividades.filter(a => a?.data === s);
  };

  const diasAtivos = dias.filter(d => getAtivsDia(d).length > 0).length;

  // ── Cores seguras ──────────────────────────────────────────────────
  const cP = theme.primary  || '#3b82f6';
  const cS = theme.success  || '#10b981';
  const cW = theme.warning  || '#f59e0b';

  const medalha = (pos) => {
    if (pos === 0) return { bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', icon: '🥇', label: '1º' };
    if (pos === 1) return { bg: 'linear-gradient(135deg,#cbd5e1,#94a3b8)', icon: '🥈', label: '2º' };
    return               { bg: 'linear-gradient(135deg,#d97706,#b45309)', icon: '🥉', label: '3º' };
  };

  if (loading || !dashboardData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', color: theme.textSub }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${cP}30`, borderTop: `3px solid ${cP}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px' }}>A preparar a tua Dashboard…</span>
      </div>
    );
  }

  const { stats } = dashboardData;
  const rank = getRank(stats?.pontuacaoTotal);
  const top3 = classificacao.slice(0, 3);

  // ── MODAL DA LEADERBOARD ───────────────────────────────────────────
  const renderLeaderboardModal = () => {
    if (!leaderboardExpandido) return null;
    return (
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
        onClick={() => setLeaderboardExpandido(false)}
      >
        <div 
          style={{ backgroundColor: theme.cardBg, width: '500px', maxWidth: '90%', maxHeight: '85vh', borderRadius: '20px', border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', animation: 'fadeIn 0.2s ease-out' }} 
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.inputBg }}>
            <h3 style={{ margin: 0, color: theme.textMain, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cP} strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Classificação Completa
            </h3>
            <button onClick={() => setLeaderboardExpandido(false)} style={{ background: 'none', border: 'none', color: theme.textSub, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Fechar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {classificacao.map((aluno, i) => {
              const isTu = aluno.id === user?.id;
              const posColor = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : theme.textSub;
              return (
                <div
                  key={aluno.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '12px',
                    backgroundColor: isTu ? `${cP}12` : i % 2 === 0 ? theme.inputBg : 'transparent',
                    border: isTu ? `1px solid ${cP}35` : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '900', color: posColor, minWidth: '28px', textAlign: 'center' }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
                  </span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: cP, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                    {aluno.avatar ? <img src={aluno.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (aluno.nome || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: isTu ? '800' : '600', color: theme.textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {aluno.nome} {isTu && <span style={{ color: cP, fontSize: '12px' }}>(Tu)</span>}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: isTu ? cP : theme.textSub }}>{aluno.xp_total || 0} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── MODAL DA COLEÇÃO DE TROFÉUS ───────────────────────────────────────────
  const renderTrofeusModal = () => {
    if (!trofeusExpandido) return null;
    return (
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
        onClick={() => setTrofeusExpandido(false)}
      >
        <div 
          style={{ backgroundColor: theme.cardBg, width: '600px', maxWidth: '90%', maxHeight: '85vh', borderRadius: '20px', border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', animation: 'fadeIn 0.2s ease-out' }} 
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.inputBg }}>
            <h3 style={{ margin: 0, color: theme.textMain, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cW} strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              Coleção de Troféus
            </h3>
            <button onClick={() => setTrofeusExpandido(false)} style={{ background: 'none', border: 'none', color: theme.textSub, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Fechar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div style={{ padding: '24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {trofeus.map((t, i) => {
              const isAberto = trofeuAtivoDescricao === i;
              return (
                <div 
                  key={i} 
                  onClick={() => setTrofeuAtivoDescricao(isAberto ? null : i)}
                  style={{ 
                    backgroundColor: theme.inputBg, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', 
                    border: isAberto ? `2px solid ${cW}` : `1px solid ${cW}30`, 
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isAberto ? `0 4px 12px ${cW}20` : 'none'
                  }}
                  onMouseEnter={(e) => { if (!isAberto) e.currentTarget.style.borderColor = cW; }}
                  onMouseLeave={(e) => { if (!isAberto) e.currentTarget.style.borderColor = `${cW}30`; }}
                >
                  <span style={{ fontSize: '32px' }}>{t.icone}</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: theme.textMain, lineHeight: 1.3 }}>{t.nome}</span>
                  <span style={{ fontSize: '11px', color: theme.textSub, fontWeight: '600', backgroundColor: theme.cardBg, padding: '2px 8px', borderRadius: '12px' }}>{t.data}</span>
                  
                  {isAberto && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${theme.inputBorder}`, color: theme.textMain, fontSize: '12px', lineHeight: '1.5', animation: 'fadeIn 0.2s ease-out' }}>
                      {t.descricao}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {renderLeaderboardModal()}
      {renderTrofeusModal()}

      {/* ── ESTATÍSTICAS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
            color: cS, value: stats?.modulosConcluidos || 0, label: 'Módulos Lidos',
          },
          {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
            color: rank.cor, value: stats?.pontuacaoTotal || 0, label: 'Pontos XP', sub: rank.titulo,
          },
          {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
            color: cW, value: stats?.diasSeguidos || 0, label: 'Dias Seguidos', sub: '🔥',
          },
        ].map((s, i) => (
          <StatCard key={i} theme={theme} icon={s.icon} color={s.color} value={s.value} label={s.label} sub={s.sub} />
        ))}
      </div>

      {/* ── GRELHA PRINCIPAL ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>

        {/* COLUNA ESQUERDA — Calendário COMPACTADO */}
        <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '16px', padding: '20px', boxShadow: theme.shadow }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cP} strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ fontWeight: '800', fontSize: '15px', color: theme.textMain }}>Calendário de Progresso</span>
            </div>
            {diasAtivos > 0 && (
              <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: `${cS}18`, color: cS, padding: '3px 8px', borderRadius: '20px' }}>
                {diasAtivos} dia{diasAtivos !== 1 ? 's' : ''} ativo{diasAtivos !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button
              onClick={() => mudarMes(-1)}
              style={{ background: 'none', border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: theme.textMain, display: 'flex', alignItems: 'center', transition: 'border-color 0.2s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontWeight: '700', fontSize: '14px', color: theme.textMain }}>{MESES[mesAtual]} {anoAtual}</span>
            <button
              onClick={() => mudarMes(1)}
              style={{ background: 'none', border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: theme.textMain, display: 'flex', alignItems: 'center', transition: 'border-color 0.2s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Diminuído o gap da grelha de dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: theme.textSub, padding: '2px 0', letterSpacing: '0.03em' }}>{d}</div>
            ))}
          </div>

          {/* Diminuído o gap da grelha de dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {espacosVazios.map((_, i) => <div key={`v${i}`} />)}
            {dias.map(dia => {
              const ativs   = getAtivsDia(dia);
              const isHoje  = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
              const isSel   = diaSelecionado === dia;
              const temAtiv = ativs.length > 0;

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSelecionado(isSel ? null : dia)}
                  style={{
                    aspectRatio: '1.2', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: isSel || isHoje ? '700' : '500',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '1px', position: 'relative', outline: 'none', transition: 'all 0.15s ease',
                    backgroundColor: isSel ? cP : temAtiv ? `${cS}15` : theme.inputBg,
                    color: isSel ? '#fff' : theme.textMain,
                    boxShadow: isHoje && !isSel ? `0 0 0 1.5px ${cP}` : 'none',
                    padding: '2px', overflow: 'hidden'
                  }}
                  title={temAtiv ? ativs.map(a => a.titulo).join(', ') : ''}
                >
                  <span style={{ fontSize: temAtiv ? '10px' : '12px' }}>{dia}</span>
                  
                  {temAtiv && !isSel && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '8px', fontWeight: '700', color: cS, width: '90%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                        {ativs[0].titulo}
                      </span>
                      {ativs.length > 1 && (
                        <span style={{ fontSize: '7px', fontWeight: 'bold', color: theme.textSub, marginTop: '-2px' }}>
                          +{ativs.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${theme.inputBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: theme.textSub }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: `${cS}22`, border: `1px solid ${cS}` }} />
              Dia ativo
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: theme.textSub }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', border: `1.5px solid ${cP}` }} />
              Hoje
            </div>
          </div>

          {/* Painel do dia selecionado otimizado para não crescer demasiado */}
          {diaSelecionado && (() => {
            const ativs = getAtivsDia(diaSelecionado);
            return (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: theme.inputBg, borderRadius: '8px', border: `1px solid ${theme.inputBorder}`, animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: ativs.length ? '8px' : 0 }}>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: theme.textMain }}>
                    {diaSelecionado} de {MESES[mesAtual]}
                  </span>
                  {ativs.length > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: '700', color: cS, backgroundColor: `${cS}15`, padding: '2px 6px', borderRadius: '6px' }}>
                      {ativs.length} atividade{ativs.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {ativs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ativs.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', backgroundColor: theme.cardBg, borderRadius: '6px', border: `1px solid ${theme.inputBorder}` }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cS, flexShrink: 0 }} />
                        <div style={{ fontSize: '11px', color: theme.textMain }}>
                          <span style={{ fontWeight: '800', color: cP, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.02em', backgroundColor: `${cP}15`, padding: '2px 4px', borderRadius: '3px', marginBottom: '2px', display: 'inline-block' }}>{a.tipo}</span>
                          <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{a.titulo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '11px', color: theme.textSub }}>Nenhuma atividade neste dia.</p>
                )}
              </div>
            );
          })()}
        </div>

        {/* COLUNA DIREITA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── LEADERBOARD ──────────────────────────────────────── */}
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cP} strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontWeight: '800', fontSize: '16px', color: theme.textMain }}>Classificação</span>
              </div>
              <span style={{ fontSize: '11px', color: theme.textSub, fontWeight: '600' }}>{classificacao.length} alunos</span>
            </div>

            {classificacao.length === 0 ? (
              <p style={{ textAlign: 'center', color: theme.textSub, fontSize: '13px', margin: 0 }}>Ainda sem dados.</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                  {top3[1] && (() => {
                    const m = medalha(1);
                    const isTu = top3[1].id === user?.id;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ fontSize: '20px' }}>🥈</div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '14px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                          {top3[1].avatar ? <img src={top3[1].avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (top3[1].nome || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMain, maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isTu ? 'Tu' : (top3[1].nome || '').split(' ')[0]}
                          </div>
                          <div style={{ fontSize: '11px', color: theme.textSub, fontWeight: '600' }}>{top3[1].xp_total || 0} XP</div>
                        </div>
                        <div style={{ width: '100%', height: '48px', background: `${m.bg}`, borderRadius: '8px 8px 0 0', opacity: 0.3 }} />
                      </div>
                    );
                  })()}

                  {top3[0] && (() => {
                    const m = medalha(0);
                    const isTu = top3[0].id === user?.id;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ fontSize: '24px' }}>🥇</div>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '16px', overflow: 'hidden', boxShadow: '0 6px 18px rgba(251,191,36,0.4)' }}>
                          {top3[0].avatar ? <img src={top3[0].avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (top3[0].nome || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: theme.textMain, maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isTu ? 'Tu' : (top3[0].nome || '').split(' ')[0]}
                          </div>
                          <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>{top3[0].xp_total || 0} XP</div>
                        </div>
                        <div style={{ width: '100%', height: '64px', background: m.bg, borderRadius: '8px 8px 0 0', opacity: 0.3 }} />
                      </div>
                    );
                  })()}

                  {top3[2] && (() => {
                    const m = medalha(2);
                    const isTu = top3[2].id === user?.id;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ fontSize: '20px' }}>🥉</div>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '14px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                          {top3[2].avatar ? <img src={top3[2].avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (top3[2].nome || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textMain, maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isTu ? 'Tu' : (top3[2].nome || '').split(' ')[0]}
                          </div>
                          <div style={{ fontSize: '11px', color: theme.textSub, fontWeight: '600' }}>{top3[2].xp_total || 0} XP</div>
                        </div>
                        <div style={{ width: '100%', height: '36px', background: m.bg, borderRadius: '8px 8px 0 0', opacity: 0.3 }} />
                      </div>
                    );
                  })()}
                </div>

                {(() => {
                  const minhaPos = classificacao.findIndex(a => a.id === user?.id);
                  if (minhaPos >= 3) {
                    const eu = classificacao[minhaPos];
                    return (
                      <div style={{ padding: '10px 14px', backgroundColor: `${cP}12`, border: `1px solid ${cP}35`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: cP, minWidth: '28px' }}>#{minhaPos + 1}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: theme.textMain, flex: 1 }}>Tu</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: cP }}>{eu?.xp_total || 0} XP</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <button
                  onClick={() => setLeaderboardExpandido(true)}
                  style={{ width: '100%', padding: '12px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', cursor: 'pointer', color: theme.textMain, fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${theme.primary}15`; e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.inputBg; e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMain; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Ver Tabela Completa ({classificacao.length} alunos)
                </button>
              </>
            )}
          </div>

          {/* ── TROFÉUS ──────────────────────────────────────────── */}
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cW} strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              <span style={{ fontWeight: '800', fontSize: '16px', color: theme.textMain }}>Troféus Recentes</span>
            </div>

            {trofeus.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: theme.textSub }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
                <p style={{ margin: 0, fontSize: '13px' }}>Completa um quiz para ganhar o teu primeiro troféu!</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  {trofeus.slice(0, 2).map((t, i) => (
                    <div key={i} style={{ backgroundColor: theme.inputBg, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', border: `1px solid ${cW}30` }}>
                      <span style={{ fontSize: '26px' }}>{t.icone}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMain, lineHeight: 1.3 }}>{t.nome}</span>
                      <span style={{ fontSize: '10px', color: theme.textSub, fontWeight: '600' }}>{t.data}</span>
                    </div>
                  ))}
                </div>
                
                {trofeus.length > 2 && (
                  <button
                    onClick={() => setTrofeusExpandido(true)}
                    style={{ width: '100%', padding: '12px', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: '10px', cursor: 'pointer', color: theme.textMain, fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${cW}15`; e.currentTarget.style.borderColor = cW; e.currentTarget.style.color = cW; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.inputBg; e.currentTarget.style.borderColor = theme.inputBorder; e.currentTarget.style.color = theme.textMain; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    Ver coleção completa ({trofeus.length})
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
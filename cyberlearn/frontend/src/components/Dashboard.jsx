import { useState } from 'react';

export default function Dashboard({ theme }) {
  // ==========================================
  // DADOS SIMULADOS (Prontos para ligar à API depois)
  // ==========================================
  const studentStats = {
    modulosConcluidos: 12,
    pontuacaoTotal: 1250,
    taxaAcerto: 85,
    diasSeguidos: 4
  };

  const cursoDestaque = {
    id: 1,
    titulo: 'Ataques de Phishing e Engenharia Social',
    moduloAtual: 'Módulo 2: Identificação de Emails Falsos',
    progresso: 65,
    tempoRestante: '15 min restantes'
  };

  const cursosAtivos = [
    { 
      id: 2, 
      titulo: 'Segurança em Redes', 
      modulo: 'Módulo 3: Firewalls e VPNs', 
      progresso: 30, 
      cor: theme.warning 
    },
    { 
      id: 3, 
      titulo: 'Criptografia Básica', 
      modulo: 'Módulo 1: Hash vs Encriptação', 
      progresso: 85, 
      cor: theme.success 
    },
    { 
      id: 4, 
      titulo: 'Higiene Cibernética', 
      modulo: 'Módulo 4: Gestão de Passwords', 
      progresso: 10, 
      cor: theme.primary 
    }
  ];

  // ==========================================
  // ESTILOS
  // ==========================================
  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '20px' },
    
    // Grid de Estatísticas
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
    statCard: { backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${theme.inputBorder}` },
    statIconBox: (color) => ({ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
    statNumber: { fontSize: '24px', fontWeight: '800', color: theme.textMain, margin: 0 },
    statLabel: { fontSize: '12px', color: theme.textSub, textTransform: 'uppercase', marginTop: '2px', fontWeight: '600', letterSpacing: '0.5px' },
    
    // Títulos de Secção
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    sectionTitle: { fontSize: '18px', color: theme.textMain, margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    
    // Cartão de Destaque (Continuar a Aprender)
    heroCard: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', backgroundImage: `linear-gradient(to right, ${theme.cardBg}, ${theme.inputBg})` },
    heroTitle: { fontSize: '20px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 8px 0' },
    heroSubtitle: { fontSize: '14px', color: theme.textSub, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' },
    heroButton: { backgroundColor: theme.primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: `0 4px 12px ${theme.primary}40` },
    
    // Grelha de Cursos
    courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    courseCard: { backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, transition: 'transform 0.2s ease, box-shadow 0.2s ease', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
    courseImagePlaceholder: (color) => ({ width: '100%', height: '120px', backgroundColor: `${color}10`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: color, borderBottom: `1px solid ${theme.inputBorder}` }),
    courseContent: { padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' },
    courseTitle: { fontSize: '16px', fontWeight: 'bold', color: theme.textMain, margin: '0 0 6px 0', lineHeight: '1.4' },
    courseModule: { fontSize: '13px', color: theme.textSub, margin: '0 0 20px 0' },
    progressBarContainer: { width: '100%', height: '8px', backgroundColor: theme.inputBg, borderRadius: '4px', overflow: 'hidden', marginTop: '5px' },
    progressBar: (progress, color) => ({ width: `${progress}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }),
    progressText: { fontSize: '12px', fontWeight: 'bold', color: theme.textMain, marginTop: '8px', textAlign: 'right' }
  };

  return (
    <div style={styles.container}>
      
      {/* 1. MÉTRICAS E GAMIFICAÇÃO */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconBox(theme.success)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div><h3 style={styles.statNumber}>{studentStats.modulosConcluidos}</h3><p style={styles.statLabel}>Módulos Concluídos</p></div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIconBox('#8b5cf6')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <div><h3 style={styles.statNumber}>{studentStats.pontuacaoTotal}</h3><p style={styles.statLabel}>Pontuação Total</p></div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconBox(theme.primary)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          </div>
          <div><h3 style={styles.statNumber}>{studentStats.taxaAcerto}%</h3><p style={styles.statLabel}>Acerto nos Quizzes</p></div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIconBox(theme.warning)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19c-1.5-2-3.5-3-5.5-3-2 0-4 1-5.5 3"></path><path d="M12 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path></svg>
          </div>
          <div><h3 style={styles.statNumber}>{studentStats.diasSeguidos}</h3><p style={styles.statLabel}>Dias Seguidos 🔥</p></div>
        </div>
      </div>

      {/* 2. DESTAQUE: CONTINUAR A APRENDER */}
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
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${theme.primary}60`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}40`; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Retomar Módulo
            </button>
          </div>
        </div>
      </div>

      {/* 3. GRELHA DE OUTROS CURSOS ATIVOS */}
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
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.15)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow; }}
            >
              {/* Imagem do Curso (Placeholder com Ícone) */}
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

    </div>
  );
}
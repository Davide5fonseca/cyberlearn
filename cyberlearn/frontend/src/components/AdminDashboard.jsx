/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../api';

// Dicionário de traduções
const translations = {
  pt: {
    'admin.activeInstructors': 'Professores Registados',
    'admin.activeSessions': 'Sessões Ativas (24h)',
    'admin.totalLogins': 'Total de Acessos',
    'admin.loginHistory': 'Histórico de Acessos',
    'admin.monitorDesc': 'Monitoriza os últimos 5 acessos à plataforma por professores.',
    'admin.fullHistoryDesc': 'Lista completa de todos os acessos efetuados por professores.',
    'admin.refresh': 'Atualizar Dados',
    'admin.exportPdf': 'Exportar PDF',
    'admin.viewAll': 'Ver Todo o Histórico',
    'admin.back': 'Voltar ao Painel',
    'notifications.notif1Title': 'Aviso',
    'admin.user': 'Professor',
    'admin.email': 'Endereço de E-mail',
    'admin.timestamp': 'Data e Hora do Acesso',
    'admin.status': 'Estado',
    'common.success': 'Sucesso',
    'admin.noData': 'Ainda não há registos de acesso.'
  }
};

// ALTERADO: Recebemos a prop `user` para sabermos o nome do Administrador
export default function AdminDashboard({ theme, user }) {
  const [lang] = useState('pt');
  const t = (key) => translations[lang][key] || key;

  const [acessos, setAcessos] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [estatisticas, setEstatisticas] = useState({
    professoresAtivos: 0,
    sessoesAtivas: 0,
    totalAcessos: 0
  });

  const carregarDados = () => {
    apiFetch('/acessos-professores')
      .then(res => res.json())
      .then(data => setAcessos(data))
      .catch(err => console.error("Erro:", err));

    apiFetch('/admin-estatisticas')
      .then(res => res.json())
      .then(data => setEstatisticas(data))
      .catch(err => console.error("Erro nas estatísticas:", err));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // ========================================================
  // LÓGICA PARA EXPORTAR PDF
  // ========================================================
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Histórico de Acessos - Professores", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text("Plataforma CyberLearn - Gerado a " + new Date().toLocaleString('pt-PT'), 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [['Professor', 'Endereço de E-mail', 'Data e Hora', 'Estado']],
      body: acessos.map(a => [a.nome, a.email, a.data, 'Sucesso']),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, 
      styles: { fontSize: 10 }
    });

    doc.save('CyberLearn_Historico_Professores.pdf');
  };

  const styles = {
    layout: { 
      animation: 'fadeIn 0.4s ease', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px',
      height: 'calc(100vh - 130px)', 
      overflow: 'hidden' 
    },
    metricGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '24px',
      flexShrink: 0 
    },
    metricCard: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    iconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: theme.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: theme.primary },
    cardContainer: { 
      backgroundColor: theme.cardBg, 
      borderRadius: '16px', 
      boxShadow: theme.shadow, 
      border: `1px solid ${theme.inputBorder}`, 
      display: 'flex', 
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden'
    },
    tableHeaderRow: { borderBottom: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg },
    th: { padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: theme.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' },
    td: { padding: '16px 24px', fontSize: '14px', color: theme.textMain, borderBottom: `1px solid ${theme.inputBorder}60` },
    badge: (status) => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: status === 'Active' ? `${theme.success}15` : `${theme.warning}15`, color: status === 'Active' ? theme.success : theme.warning, display: 'inline-flex', alignItems: 'center', gap: '4px' }),
    buttonSecondary: { backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' },
    buttonDanger: { backgroundColor: theme.danger, border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }
  };

  // ========================================================
  // VISTA 1: "PÁGINA" DO HISTÓRICO COMPLETO
  // ========================================================
  if (showHistory) {
    return (
      <div style={styles.layout}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', flexShrink: 0 }}>
          <button 
            onClick={() => setShowHistory(false)}
            style={{...styles.buttonSecondary, padding: '10px 18px', fontSize: '14px'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            {t('admin.back')}
          </button>

          <button 
            onClick={handleExportPDF}
            style={styles.buttonDanger}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {t('admin.exportPdf')}
          </button>
        </div>

        <div style={styles.cardContainer}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${theme.inputBorder}`, flexShrink: 0 }}>
            <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>{t('admin.loginHistory')}</h2>
            <p style={{ color: theme.textSub, fontSize: '14px', margin: 0 }}>
              {t('admin.fullHistoryDesc')}
            </p>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.cardBg, zIndex: 1, boxShadow: `0 1px 0 ${theme.inputBorder}` }}>
                <tr style={styles.tableHeaderRow}>
                  <th style={{...styles.th, paddingLeft: '32px'}}>{t('admin.user')}</th>
                  <th style={styles.th}>{t('admin.email')}</th>
                  <th style={styles.th}>{t('admin.timestamp')}</th>
                  <th style={styles.th}>{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {acessos.length > 0 ? acessos.map(acesso => (
                  <tr key={acesso.id} style={{ transition: 'background-color 0.2s', ':hover': { backgroundColor: theme.inputBg } }}>
                    <td style={{...styles.td, paddingLeft: '32px'}}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                          {acesso.nome.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '600' }}>{acesso.nome}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{acesso.email}</td>
                    <td style={{...styles.td, color: theme.textSub}}>{acesso.data}</td>
                    <td style={styles.td}>
                      <div style={styles.badge('Active')}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                        {t('common.success')}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '64px 24px', textAlign: 'center' }}>
                      <div style={{ color: theme.textSub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                         <span>{t('admin.noData')}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // VISTA 2: PAINEL PRINCIPAL (DASHBOARD COM MÉTRICAS)
  // ========================================================
  const acessosExibidos = acessos.slice(0, 5);

  return (
    <div style={styles.layout}>
      
      {/* NOVO BLOCO: Saudação e Mensagem */}
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', color: theme.textMain, margin: '0 0 4px 0', fontWeight: 'bold' }}>
          Olá, {user?.nome ? user.nome.split(' ')[0] : 'Administrador'}!
        </h1>
        <p style={{ color: theme.textSub, margin: 0, fontSize: '14px' }}>
          Aqui está a atividade dos professores.
        </p>
      </div>

      {/* Top Metric Grid */}
      <div style={styles.metricGrid}>
        <div style={styles.metricCard}>
          <div style={styles.iconBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{t('admin.activeInstructors')}</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>{estatisticas.professoresAtivos}</h3>
        </div>
        
        <div style={styles.metricCard}>
          <div style={{...styles.iconBox, color: theme.success}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{t('admin.activeSessions')}</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>{estatisticas.sessoesAtivas}</h3>
        </div>
        
        <div style={styles.metricCard}>
          <div style={{...styles.iconBox, color: theme.warning}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{t('admin.totalLogins')}</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>{estatisticas.totalAcessos}</h3>
        </div>
      </div>

      <div style={styles.cardContainer}>
        
        {/* CABEÇALHO DA TABELA PRINCIPAL */}
        <div style={{ padding: '24px', borderBottom: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>{t('admin.loginHistory')}</h2>
            <p style={{ color: theme.textSub, fontSize: '14px', margin: 0 }}>
              {t('admin.monitorDesc')} 
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {acessos.length > 5 && (
              <button 
                onClick={() => setShowHistory(true)}
                style={styles.buttonSecondary}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                {t('admin.viewAll')}
              </button>
            )}

            <button 
              onClick={() => { carregarDados(); alert(t('notifications.notif1Title') + ": Dados atualizados."); }}
              style={styles.buttonSecondary}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              {t('admin.refresh')}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.cardBg, zIndex: 1, boxShadow: `0 1px 0 ${theme.inputBorder}` }}>
              <tr style={styles.tableHeaderRow}>
                <th style={{...styles.th, paddingLeft: '32px'}}>{t('admin.user')}</th>
                <th style={styles.th}>{t('admin.email')}</th>
                <th style={styles.th}>{t('admin.timestamp')}</th>
                <th style={styles.th}>{t('admin.status')}</th>
              </tr>
            </thead>
            <tbody>
              {acessosExibidos.length > 0 ? acessosExibidos.map(acesso => (
                <tr key={acesso.id} style={{ transition: 'background-color 0.2s', ':hover': { backgroundColor: theme.inputBg } }}>
                  <td style={{...styles.td, paddingLeft: '32px'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                        {acesso.nome.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '600' }}>{acesso.nome}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{acesso.email}</td>
                  <td style={{...styles.td, color: theme.textSub}}>{acesso.data}</td>
                  <td style={styles.td}>
                    <div style={styles.badge('Active')}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                      {t('common.success')}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ color: theme.textSub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                       <span>{t('admin.noData')}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
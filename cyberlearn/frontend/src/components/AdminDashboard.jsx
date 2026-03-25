/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

// Dicionário de traduções
const translations = {
  pt: {
    'admin.activeInstructors': 'Professores Ativos',
    'admin.activeSessions': 'Sessões Ativas (24h)',
    'admin.totalLogins': 'Total de Acessos',
    'admin.sysLoad': 'Carga do Sistema',
    'admin.loginHistory': 'Histórico de Acessos',
    'admin.monitorDesc': 'Monitoriza os últimos 50 acessos à plataforma por professores.',
    'admin.refresh': 'Atualizar Dados',
    'notifications.notif1Title': 'Aviso',
    'admin.user': 'Utilizador',
    'admin.email': 'Endereço de E-mail',
    'admin.timestamp': 'Data e Hora',
    'admin.status': 'Estado',
    'common.success': 'Sucesso',
    'admin.noData': 'Ainda não há registos de acesso.'
  }
};

export default function AdminDashboard({ theme }) {
  const [lang] = useState('pt');
  const t = (key) => translations[lang][key] || key;

  const [acessos, setAcessos] = useState([]);
  
  // NOVO: Estado para guardar os números reais dos cartões
  const [estatisticas, setEstatisticas] = useState({
    professoresAtivos: 0,
    sessoesAtivas: 0,
    totalAcessos: 0,
    cargaSistema: 0
  });

  // Função para ir buscar tudo à base de dados
  const carregarDados = () => {
    // 1. Carrega a lista da tabela
    fetch('http://localhost:8080/acessos-professores')
      .then(res => res.json())
      .then(data => setAcessos(data))
      .catch(err => console.error("Erro:", err));

    // 2. Carrega os números dos cartões superiores
    fetch('http://localhost:8080/admin-estatisticas')
      .then(res => res.json())
      .then(data => setEstatisticas(data))
      .catch(err => console.error("Erro nas estatísticas:", err));
  };

  // Carrega os dados mal a página abre
  useEffect(() => {
    carregarDados();
  }, []);

  const styles = {
    layout: { animation: 'fadeIn 0.4s ease', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' },
    metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' },
    metricCard: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    iconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: theme.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: theme.primary },
    cardContainer: { backgroundColor: theme.cardBg, borderRadius: '16px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}`, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' },
    tableHeaderRow: { borderBottom: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg },
    th: { padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: theme.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' },
    td: { padding: '16px 24px', fontSize: '14px', color: theme.textMain, borderBottom: `1px solid ${theme.inputBorder}60` },
    badge: (status) => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: status === 'Active' ? `${theme.success}15` : `${theme.warning}15`, color: status === 'Active' ? theme.success : theme.warning, display: 'inline-flex', alignItems: 'center', gap: '4px' })
  };

  return (
    <div style={styles.layout}>
      
      {/* Top 4-Metric Grid com DADOS REAIS */}
      <div style={styles.metricGrid}>
        <div style={styles.metricCard}>
          <div style={styles.iconBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{t('admin.activeInstructors')}</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>
            {estatisticas.professoresAtivos}
          </h3>
        </div>
        
        <div style={styles.metricCard}>
          <div style={{...styles.iconBox, color: theme.success}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{t('admin.activeSessions')}</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>
            {estatisticas.sessoesAtivas}
          </h3>
        </div>
        
        <div style={styles.metricCard}>
          <div style={{...styles.iconBox, color: theme.warning}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{t('admin.totalLogins')}</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>
            {estatisticas.totalAcessos}
          </h3>
        </div>
        
        <div style={styles.metricCard}>
          <div style={{...styles.iconBox, color: theme.danger}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>{t('admin.sysLoad')}</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>
            {estatisticas.cargaSistema}%
          </h3>
        </div>
      </div>

      {/* Tabela Principal */}
      <div style={styles.cardContainer}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>{t('admin.loginHistory')}</h2>
            <p style={{ color: theme.textSub, fontSize: '14px', margin: 0 }}>{t('admin.monitorDesc')}</p>
          </div>
          <button 
            onClick={() => {
              carregarDados(); // Chama a função que atualiza cartões E tabela!
              alert(t('notifications.notif1Title') + ": Tabela e métricas atualizadas.");
            }}
            style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            {t('admin.refresh')}
          </button>
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
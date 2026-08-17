import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useUI } from './ui/UIProvider';
import { useTranslation } from '../i18n';
import TabelaAcessos from './ui/TabelaAcessos';
import MetricCard from './ui/MetricCard';
import { useExportPdf } from '../hooks/useExportPdf';

export default function AdminDashboard({ theme }) {
  const { notify } = useUI();
  const t = useTranslation();
  const exportarPdf = useExportPdf();

  const [acessos, setAcessos] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [estatisticas, setEstatisticas] = useState({
    professoresAtivos: 0,
    sessoesAtivas: 0,
    totalAcessos: 0
  });

  const carregarDados = () => {
    // Validar res.ok e o formato: uma resposta de erro ({erro}) deixava
    // `acessos` sem ser array e rebentava o render com TypeError.
    apiFetch('/acessos-professores')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(data => { if (Array.isArray(data)) setAcessos(data); })
      .catch(err => console.error("Erro:", err));

    apiFetch('/admin-estatisticas')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(data => setEstatisticas(prev => ({ ...prev, ...data })))
      .catch(err => console.error("Erro nas estatísticas:", err));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // EXPORTAR PDF (o jspdf é carregado sob demanda pelo hook)
  const handleExportPDF = async () => {
    try {
      await exportarPdf({
        titulo: 'Histórico de Acessos - Professores',
        subtitulo: 'Plataforma CyberLearn - Gerado a ' + new Date().toLocaleString('pt-PT'),
        colunas: ['Professor', 'Endereço de E-mail', 'Data e Hora', 'Estado'],
        linhas: acessos.map(a => [a.nome, a.email, a.data, 'Sucesso']),
        nomeFicheiro: 'CyberLearn_Historico_Professores.pdf',
      });
    } catch (error) {
      // O import dinâmico pode falhar sem ligação à rede.
      console.error("Erro ao gerar PDF:", error);
      notify(t('profDash.erroPdf'), 'error');
    }
  };

  const styles = {
    layout: {
      animation: 'fadeIn 0.4s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      // Altura fixa em ecrãs normais (a tabela faz scroll interno), mas com
      // minHeight e sem overflow hidden para que, em ecrãs pequenos, o
      // conteúdo transborde para o scroll do AppLayout em vez de ser cortado.
      height: 'calc(100vh - 130px)',
      minHeight: '460px'
    },
    metricGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      flexShrink: 0
    },
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
    buttonSecondary: { backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textMain, padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' },
    buttonDanger: { backgroundColor: theme.danger, border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }
  };

  const cabecalhosTabela = [t('admin.user'), t('admin.email'), t('admin.timestamp'), t('admin.status')];

  // VISTA 1: "PÁGINA" DO HISTÓRICO COMPLETO
  if (showHistory) {
    return (
      <div style={styles.layout}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            style={{...styles.buttonSecondary, padding: '10px 18px', fontSize: '14px'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            {t('admin.back')}
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            style={styles.buttonDanger}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
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

          <TabelaAcessos
            theme={theme}
            acessos={acessos}
            cabecalhos={cabecalhosTabela}
            textoVazio={t('admin.noData')}
          />
        </div>
      </div>
    );
  }

  // VISTA 2: DASHBOARD
  const acessosExibidos = acessos.slice(0, 5);

  return (
    <div style={styles.layout}>

      {/* Top Metric Grid */}
      <div style={styles.metricGrid}>
        <MetricCard
          theme={theme}
          etiqueta={t('admin.activeInstructors')}
          valor={estatisticas.professoresAtivos}
          icone={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
        />

        <MetricCard
          theme={theme}
          etiqueta={t('admin.activeSessions')}
          valor={estatisticas.sessoesAtivas}
          cor={theme.success}
          corFundo={`${theme.success}15`}
          icone={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
        />

        <MetricCard
          theme={theme}
          etiqueta={t('admin.totalLogins')}
          valor={estatisticas.totalAcessos}
          cor={theme.warning}
          corFundo={`${theme.warning}15`}
          icone={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>}
        />
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
                type="button"
                onClick={() => setShowHistory(true)}
                style={styles.buttonSecondary}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                {t('admin.viewAll')}
              </button>
            )}

            <button
              type="button"
              onClick={() => { carregarDados(); notify(t('profDash.dadosAtualizados'), 'success'); }}
              style={styles.buttonSecondary}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              {t('admin.refresh')}
            </button>
          </div>
        </div>

        <TabelaAcessos
          theme={theme}
          acessos={acessosExibidos}
          cabecalhos={cabecalhosTabela}
          textoVazio={t('admin.noData')}
        />
      </div>
    </div>
  );
}

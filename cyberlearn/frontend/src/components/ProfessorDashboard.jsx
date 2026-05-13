/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../api';

export default function ProfessorDashboard({ theme, user }) {
  const [acessos, setAcessos] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/acessos');
      const data = await response.json();
      if (response.ok) {
        setAcessos(data);
      }
    } catch (error) {
      console.error("Erro de ligação:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const totalAcessos = acessos.length;
  const alunosAtivos = new Set(acessos.map(a => a.email)).size;


  // EXPORTAR PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const primaryColor = [59, 130, 246]; 
      const textColor = [51, 51, 51];

      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("CyberLearn", 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text("Relatório Oficial de Atividade da Turma", 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')} | Professor: ${user?.nome || 'N/A'}`, 14, 38);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 42, 196, 42);

      autoTable(doc, {
        startY: 50,
        head: [['ID', 'Nome do Aluno', 'Endereço de E-mail', 'Data e Hora', 'Estado']],
        body: acessos.map(a => [`#${a.id}`, a.nome, a.email, a.data, 'Sucesso']),
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { cellPadding: 6, fontSize: 10, font: 'helvetica' },
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50; 
      
      doc.setFontSize(12);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text("O Professor Responsável,", 14, finalY + 30);
      
      doc.setDrawColor(0, 0, 0); 
      doc.line(14, finalY + 50, 80, finalY + 50); 
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount} - Gerado por CyberLearn LMS`, 14, 290);
      }

      doc.save("CyberLearn_Relatorio_Acessos_Turma.pdf");
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um problema ao gerar o PDF. Verifica a consola.");
    }
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

  // VISTA 1: HISTÓRICO COMPLETO DE ACESSOS
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
            Voltar ao Painel
          </button>

          <button 
            onClick={handleExportPDF}
            style={styles.buttonDanger}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exportar Relatório PDF
          </button>
        </div>

        <div style={styles.cardContainer}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${theme.inputBorder}`, flexShrink: 0 }}>
            <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>Histórico de Acessos da Turma</h2>
            <p style={{ color: theme.textSub, fontSize: '14px', margin: 0 }}>
              Lista completa de todos os acessos efetuados pelos alunos.
            </p>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.cardBg, zIndex: 1, boxShadow: `0 1px 0 ${theme.inputBorder}` }}>
                <tr style={styles.tableHeaderRow}>
                  <th style={{...styles.th, paddingLeft: '32px'}}>Aluno</th>
                  <th style={styles.th}>Endereço de E-mail</th>
                  <th style={styles.th}>Data e Hora do Acesso</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {acessos.length > 0 ? acessos.map(acesso => (
                  <tr key={acesso.id} style={{ transition: 'background-color 0.2s', ':hover': { backgroundColor: theme.inputBg } }}>
                    <td style={{...styles.td, paddingLeft: '32px'}}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', overflow: 'hidden' }}>
                          {/* Desenha a foto ou a inicial */}
                          {acesso.avatar ? (
                            <img src={acesso.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            acesso.nome.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span style={{ fontWeight: '600' }}>{acesso.nome}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{acesso.email}</td>
                    <td style={{...styles.td, color: theme.textSub}}>{acesso.data}</td>
                    <td style={styles.td}>
                      <div style={styles.badge('Active')}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                        Sucesso
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '64px 24px', textAlign: 'center' }}>
                      <div style={{ color: theme.textSub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                         <span>Ainda não há registos de acesso de alunos.</span>
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

  // VISTA 2: DASHBOARD
  const acessosExibidos = acessos.slice(0, 5);

  return (
    <div style={styles.layout}>

      <div style={styles.metricGrid}>
        <div style={styles.metricCard}>
          <div style={styles.iconBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>Alunos Ativos</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>{alunosAtivos}</h3>
        </div>
        
        <div style={styles.metricCard}>
          <div style={{...styles.iconBox, color: theme.success, backgroundColor: `${theme.success}15`}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <p style={{ margin: '0 0 4px 0', color: theme.textSub, fontSize: '13px', fontWeight: '600' }}>Total de Acessos</p>
          <h3 style={{ margin: 0, color: theme.textMain, fontSize: '28px', fontWeight: '800' }}>{totalAcessos}</h3>
        </div>
        
      </div>

      <div style={styles.cardContainer}>
        
        {/* CABEÇALHO DA TABELA PRINCIPAL */}
        <div style={{ padding: '24px', borderBottom: `1px solid ${theme.inputBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>Últimos Acessos</h2>
            <p style={{ color: theme.textSub, fontSize: '14px', margin: 0 }}>
              Monitoriza os últimos {acessosExibidos.length} acessos à plataforma por alunos.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            
            <button 
              onClick={() => setShowHistory(true)}
              style={styles.buttonSecondary}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Ver Todo o Histórico
            </button>

            <button 
              onClick={() => { carregarDados(); alert("Aviso: Dados atualizados."); }}
              style={styles.buttonSecondary}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Atualizar Dados
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.cardBg, zIndex: 1, boxShadow: `0 1px 0 ${theme.inputBorder}` }}>
              <tr style={styles.tableHeaderRow}>
                <th style={{...styles.th, paddingLeft: '32px'}}>Aluno</th>
                <th style={styles.th}>Endereço de E-mail</th>
                <th style={styles.th}>Data e Hora do Acesso</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '64px 24px', textAlign: 'center', color: theme.textSub }}>A carregar dados...</td>
                </tr>
              ) : acessosExibidos.length > 0 ? acessosExibidos.map(acesso => (
                <tr key={acesso.id} style={{ transition: 'background-color 0.2s', ':hover': { backgroundColor: theme.inputBg } }}>
                  <td style={{...styles.td, paddingLeft: '32px'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', overflow: 'hidden' }}>
                         {/* Desenha a foto ou a inicial */}
                         {acesso.avatar ? (
                            <img src={acesso.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            acesso.nome.charAt(0).toUpperCase()
                          )}
                      </div>
                      <span style={{ fontWeight: '600' }}>{acesso.nome}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{acesso.email}</td>
                  <td style={{...styles.td, color: theme.textSub}}>{acesso.data}</td>
                  <td style={styles.td}>
                    <div style={styles.badge('Active')}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                      Sucesso
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ color: theme.textSub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                       <span>Ainda não há registos de acesso de alunos.</span>
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
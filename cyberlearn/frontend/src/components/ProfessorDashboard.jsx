import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../api';

export default function ProfessorDashboard({ theme }) {
  const [loginsReais, setLoginsReais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllLogins, setShowAllLogins] = useState(false);

  useEffect(() => {
    buscarAcessos();
  }, []);

  const buscarAcessos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/acessos');
      const data = await response.json();
      if (response.ok) {
        setLoginsReais(data);
      }
    } catch (error) {
      console.error("Erro de ligação:", error);
    } finally {
      setLoading(false);
    }
  };

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
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}`, 14, 38);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 42, 196, 42);

      const tableColumn = ["ID", "Nome do Aluno", "Email", "Data e Hora de Acesso"];
      const tableRows = [];

      loginsReais.forEach(login => {
        const loginData = [
          `#${login.id}`,
          login.nome,
          login.email,
          login.data
        ];
        tableRows.push(loginData);
      });

      autoTable(doc, {
        startY: 50,
        head: [tableColumn],
        body: tableRows,
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
      
      doc.setFontSize(10);
      doc.text("Assinatura", 14, finalY + 55);

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount} - Gerado por CyberLearn LMS`, 14, 290);
      }

      doc.save("CyberLearn_Relatorio_Acessos.pdf");
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um problema ao gerar o PDF. Verifica a consola.");
    }
  };

  const styles = {
    card: { backgroundColor: theme.cardBg, borderRadius: '12px', padding: '25px', boxShadow: theme.shadow },
    sectionTitle: { fontSize: '18px', color: theme.textMain, marginBottom: '15px', marginTop: 0, fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: theme.textMain, fontSize: '13px' },
    
    // MUDANÇA: O cabeçalho da tabela fica com fundo colado ao topo!
    th: { 
        padding: '12px', 
        borderBottom: `2px solid ${theme.inputBorder}`, 
        color: theme.textSub, 
        textTransform: 'uppercase', 
        fontSize: '11px',
        position: 'sticky', 
        top: 0, 
        backgroundColor: theme.cardBg, 
        zIndex: 1,
        letterSpacing: '0.5px'
    },
    td: { padding: '12px', borderBottom: `1px solid ${theme.inputBorder}60` },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' },
    statCard: { backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.3s ease' },
    statNumber: { fontSize: '24px', fontWeight: 'bold', color: theme.textMain, margin: 0 },
    statLabel: { fontSize: '11px', color: theme.textSub, textTransform: 'uppercase', marginTop: '4px', fontWeight: '600' },
    submitButton: { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: `0 4px 10px rgba(239, 68, 68, 0.3)` }
  };

  return (
    <>
      <h1 style={{ color: theme.textMain, marginBottom: '25px', fontSize: '22px' }}>Visão Geral da Turma</h1>
      
      {showAllLogins ? (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button style={{ backgroundColor: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setShowAllLogins(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Voltar
              </button>
              <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Histórico Completo de Alunos</h2>
            </div>
            
            <button 
              style={styles.submitButton} 
              onClick={handleExportPDF}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 18 15 15"></polyline></svg> 
              Exportar PDF Oficial
            </button>
          </div>

          {/* MUDANÇA: Caixa com max-height e scroll! */}
          <div style={{ overflowY: 'auto', maxHeight: '60vh', border: `1px solid ${theme.inputBorder}50`, borderRadius: '8px' }}>
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>ID</th><th style={styles.th}>Nome do Aluno</th><th style={styles.th}>Email</th><th style={styles.th}>Data/Hora</th></tr>
              </thead>
              <tbody>
                {loginsReais.map(login => (
                  <tr key={login.id}>
                    <td style={styles.td}>#{login.id}</td><td style={{ ...styles.td, fontWeight: 'bold' }}>{login.nome}</td>
                    <td style={{ ...styles.td, color: theme.textSub }}>{login.email}</td><td style={styles.td}>{login.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ padding: '12px', backgroundColor: `${theme.primary}20`, borderRadius: '10px', color: theme.primary }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
              <div><h3 style={styles.statNumber}>{loginsReais.length}</h3><p style={styles.statLabel}>Logins de Alunos</p></div>
            </div>
            <div style={styles.statCard}>
              <div style={{ padding: '12px', backgroundColor: '#10b98120', borderRadius: '10px', color: '#10b981' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div>
              <div><h3 style={styles.statNumber}>-</h3><p style={styles.statLabel}>Cursos Ativos</p></div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Últimos Acessos de Alunos</h2>

            {loading ? (
              <div style={{textAlign: 'center', padding: '30px 0'}}>
                <p style={{ color: theme.textSub, fontSize: '13px' }}>A carregar acessos da base de dados...</p>
              </div>
            ) : loginsReais.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 20px', border: `2px dashed ${theme.inputBorder}`, borderRadius: '12px', backgroundColor: theme.inputBg}}>
                 <p style={{color: theme.textSub, margin: 0, fontSize: '13px'}}>Ainda não existem logins de alunos registados.</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto', border: `1px solid ${theme.inputBorder}50`, borderRadius: '8px' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>ID</th><th style={styles.th}>Nome do Aluno</th><th style={styles.th}>Data/Hora</th></tr>
                    </thead>
                    <tbody>
                      {loginsReais.slice(0, 5).map(login => (
                        <tr key={login.id}>
                          <td style={styles.td}>#{login.id}</td>
                          <td style={{ ...styles.td, fontWeight: 'bold' }}>{login.nome}</td>
                          <td style={styles.td}>{login.data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {loginsReais.length > 5 && (
                  <button 
                    style={{ ...styles.submitButton, width: '100%', justifyContent: 'center', backgroundColor: theme.inputBg, color: theme.primary, marginTop: '20px', boxShadow: 'none', border: `1px solid ${theme.primary}50` }} 
                    onClick={() => setShowAllLogins(true)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = theme.primary; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = theme.inputBg; e.currentTarget.style.color = theme.primary; }}
                  >
                    Ver Histórico Completo ({loginsReais.length} Acessos)
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
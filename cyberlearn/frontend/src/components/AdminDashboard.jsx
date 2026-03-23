import { useState, useEffect } from 'react';

export default function AdminDashboard({ theme }) {
  const [acessos, setAcessos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8080/acessos-professores')
      .then(res => res.json())
      .then(data => setAcessos(data))
      .catch(err => console.error("Erro:", err));
  }, []);

  return (
    <div style={{ 
      backgroundColor: theme.cardBg, 
      padding: '20px', 
      borderRadius: '12px', 
      boxShadow: theme.shadow,
      // COMPACTAÇÃO AQUI: Define altura fixa e layout flex para bloquear o crescimento do cartão
      height: 'calc(100vh - 120px)', 
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{ color: theme.textMain, marginTop: 0 }}>Histórico de Logins (Professores)</h2>
      <p style={{ color: theme.textSub, fontSize: '14px', marginBottom: '20px' }}>
        Monitoriza os últimos 50 acessos dos professores na plataforma.
      </p>

      {/* COMPACTAÇÃO AQUI: flex: 1 faz com que esta div ocupe apenas o espaço livre restante no cartão */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', paddingRight: '5px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.cardBg, zIndex: 1 }}>
            <tr style={{ borderBottom: `2px solid ${theme.inputBorder}`, color: theme.textMain }}>
              <th style={{ padding: '12px' }}>Nome do Professor</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Data e Hora de Acesso</th>
            </tr>
          </thead>
          <tbody>
            {acessos.length > 0 ? acessos.map(acesso => (
              <tr key={acesso.id} style={{ borderBottom: `1px solid ${theme.inputBorder}`, color: theme.textSub }}>
                <td style={{ padding: '12px' }}>{acesso.nome}</td>
                <td style={{ padding: '12px' }}>{acesso.email}</td>
                <td style={{ padding: '12px' }}>{acesso.data}</td>
              </tr>
            )) : (
              <tr><td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: theme.textSub }}>Nenhum acesso registado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
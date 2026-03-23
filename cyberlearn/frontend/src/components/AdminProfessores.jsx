import { useState, useEffect } from 'react';

export default function AdminProfessores({ theme }) {
  const [professores, setProfessores] = useState([]);

  const carregarProfessores = () => {
    fetch('http://localhost:8080/professores')
      .then(res => res.json())
      .then(data => setProfessores(data))
      .catch(err => console.error("Erro ao carregar:", err));
  };

  useEffect(() => {
    carregarProfessores();
  }, []);

  const handleEliminar = async (id, nome) => {
    if (!window.confirm(`Tens a certeza absoluta que pretendes eliminar o professor ${nome}? Todos os cursos criados por ele serão também apagados permanentemente.`)) return;

    try {
      const response = await fetch(`http://localhost:8080/professores/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        alert(data.mensagem);
        carregarProfessores(); // Atualiza a lista após eliminar
      } else {
        alert(`Erro: ${data.erro}`);
      }
    } catch (error) {
      alert("Erro de ligação ao servidor.");
    }
  };

  return (
    // NOVO: Adicionei esta div "wrapper" com maxHeight e overflowY
    <div style={{ maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: '10px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {professores.map(prof => (
          <div key={prof.id} style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, borderTop: `4px solid ${theme.primary}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                {prof.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, color: theme.textMain, fontSize: '18px' }}>{prof.nome}</h3>
                <p style={{ margin: 0, color: theme.textSub, fontSize: '14px' }}>{prof.email}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: theme.inputBg, borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', color: theme.textSub, fontSize: '13px' }}><strong>Data de Registo:</strong> {prof.data_registo}</p>
              <p style={{ margin: 0, color: theme.textSub, fontSize: '13px' }}><strong>ID do Sistema:</strong> #{prof.id}</p>
            </div>

            <button 
              onClick={() => handleEliminar(prof.id, prof.nome)}
              style={{ width: '100%', padding: '10px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Eliminar Professor
            </button>
          </div>
        ))}
        
        {professores.length === 0 && (
          <p style={{ color: theme.textSub }}>Nenhum professor registado de momento.</p>
        )}
      </div>

    </div>
  );
}
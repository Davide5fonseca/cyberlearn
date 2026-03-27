/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import Profile from './Profile'; // Importamos o Perfil para o usar em modo "Read-Only"
import { apiFetch } from '../api';

export default function AdminProfessores({ theme }) {
  const [professores, setProfessores] = useState([]);
  
  // NOVO: Estado para saber qual professor o Admin está a ver no momento
  const [professorSelecionado, setProfessorSelecionado] = useState(null);

  const carregarProfessores = () => {
    apiFetch('/professores')
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
      const response = await apiFetch(`/professores/${id}`, { method: 'DELETE' });
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

  // ==========================================
  // VISTA 1: MODO VISUALIZAÇÃO DE PERFIL
  // ==========================================
  if (professorSelecionado) {
    return (
      <div style={{ maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: '10px' }}>
        
        {/* BOTÃO VOLTAR */}
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setProfessorSelecionado(null)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
              backgroundColor: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.inputBorder}`, 
              borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBorder}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.inputBg}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Voltar à Lista de Professores
          </button>
        </div>

        {/* RENDERIZA O PERFIL EM MODO APENAS LEITURA */}
        <Profile 
          theme={theme}
          isReadOnly={true}
          viewedUser={{ ...professorSelecionado, tipo: 'professor' }} 
          profileData={professorSelecionado} // Passa os dados para preencher as caixas de texto bloqueadas
        />
      </div>
    );
  }

  // ==========================================
  // VISTA 2: LISTA DE PROFESSORES (GRELHA)
  // ==========================================
  return (
    <div style={{ maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {professores.map(prof => (
          <div key={prof.id} style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, borderTop: `4px solid ${theme.primary}`, display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold', overflow: 'hidden' }}>
                {prof.avatar_url ? (
                  <img src={prof.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  prof.nome.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, color: theme.textMain, fontSize: '18px' }}>{prof.nome}</h3>
                <p style={{ margin: 0, color: theme.textSub, fontSize: '14px' }}>{prof.email}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: theme.inputBg, borderRadius: '8px', flexGrow: 1 }}>
              <p style={{ margin: '0 0 5px 0', color: theme.textSub, fontSize: '13px' }}><strong>Data de Registo:</strong> {prof.data_registo}</p>
              <p style={{ margin: 0, color: theme.textSub, fontSize: '13px' }}><strong>ID do Sistema:</strong> #{prof.id}</p>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setProfessorSelecionado(prof)}
                style={{ flex: 1, padding: '10px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Ver Perfil
              </button>

              <button 
                onClick={() => handleEliminar(prof.id, prof.nome)}
                style={{ padding: '10px 14px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                title="Eliminar Professor"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>

          </div>
        ))}
        
        {professores.length === 0 && (
          <p style={{ color: theme.textSub, gridColumn: '1 / -1' }}>Nenhum professor registado de momento.</p>
        )}
      </div>

    </div>
  );
}
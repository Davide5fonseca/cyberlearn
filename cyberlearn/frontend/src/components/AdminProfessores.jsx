/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import Profile from './Profile'; // Importamos o Perfil para podermos espreitar os dados
import { apiFetch } from '../api';

export default function AdminProfessores({ theme }) {
  const [professores, setProfessores] = useState([]);
  
  // Guardamos aqui o professor que o Administrador quer ver no momento
  const [professorSelecionado, setProfessorSelecionado] = useState(null);

  // Função que vai buscar a nossa equipa de professores ao servidor
  const carregarProfessores = () => {
    apiFetch('/professores')
      .then(res => res.json())
      .then(data => setProfessores(data))
      .catch(err => console.error("Ups, problema ao carregar a equipa:", err));
  };

  // Assim que a página abre, chamamos a equipa
  useEffect(() => {
    carregarProfessores();
  }, []);

  // Função para despedir/remover um professor
  const handleEliminar = async (id, nome) => {
    // Um aviso mais humano e claro sobre as consequências
    const confirmacao = window.confirm(
      `Queres mesmo remover o professor ${nome} da plataforma? 😢\n\nAtenção: Todos os cursos, materiais e quizzes que esta pessoa criou vão desaparecer para sempre. Esta ação não tem volta a dar!`
    );
    
    if (!confirmacao) return;

    try {
      const response = await apiFetch(`/professores/${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        alert(`Feito! ${data.mensagem} 👋`);
        carregarProfessores(); // Atualizamos a montra para refletir a saída
      } else {
        alert(`Ops, algo correu mal: ${data.erro} 🛑`);
      }
    } catch (error) {
      alert("Não conseguimos ligar ao servidor. Verifica a tua internet e tenta de novo. 🔌");
    }
  };

  // ==========================================
  // VISTA 1: ESPREITAR O PERFIL DO PROFESSOR
  // ==========================================
  if (professorSelecionado) {
    return (
      <div style={{ maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: '10px' }}>
        
        {/* Botão amigável para voltar atrás */}
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
            Voltar
          </button>
        </div>

        {/* Mostramos o perfil trancado (modo de leitura) para o Admin não estragar nada sem querer */}
        <Profile 
          theme={theme}
          isReadOnly={true}
          viewedUser={{ ...professorSelecionado, tipo: 'professor' }} 
          profileData={professorSelecionado} 
        />
      </div>
    );
  }

  // ==========================================
  // VISTA 2: MONTRA DE PROFESSORES (GRELHA)
  // ==========================================
  return (
    <div style={{ maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        
        {professores.map(prof => (
          <div key={prof.id} style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '12px', boxShadow: theme.shadow, borderTop: `4px solid ${theme.primary}`, display: 'flex', flexDirection: 'column' }}>
            
            {/* Cabeçalho do Cartão: Foto, Nome e Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: theme.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold', overflow: 'hidden' }}>
                {prof.avatar_url ? (
                  <img src={prof.avatar_url} alt={`Foto de ${prof.nome}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  prof.nome.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, color: theme.textMain, fontSize: '18px' }}>{prof.nome}</h3>
                <p style={{ margin: 0, color: theme.textSub, fontSize: '14px' }}>{prof.email}</p>
              </div>
            </div>
            
            {/* Detalhes de Registo */}
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: theme.inputBg, borderRadius: '8px', flexGrow: 1 }}>
              <p style={{ margin: '0 0 5px 0', color: theme.textSub, fontSize: '13px' }}><strong>Na plataforma desde:</strong> {prof.data_registo}</p>
              <p style={{ margin: 0, color: theme.textSub, fontSize: '13px' }}><strong>Nº de Identificação:</strong> #{prof.id}</p>
            </div>

            {/* Zona de Ação: Ver e Remover */}
            <div style={{ display: 'flex', gap: '10px' }}>
              
              <button 
                onClick={() => setProfessorSelecionado(prof)}
                style={{ flex: 1, padding: '10px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Espreitar Perfil
              </button>

              <button 
                onClick={() => handleEliminar(prof.id, prof.nome)}
                style={{ padding: '10px 14px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                title="Remover Professor"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>

          </div>
        ))}
        
        {/* O que mostrar se não houver professores */}
        {professores.length === 0 && (
          <p style={{ color: theme.textSub, gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', fontSize: '15px' }}>
            Ainda não tens nenhum professor na tua equipa. Que tal convidar alguém? 🌱
          </p>
        )}
      </div>

    </div>
  );
}
import { useState, useEffect, useMemo } from 'react';
import Profile from './Profile';
import { apiFetch } from '../api';
import { useUI } from './ui/UIProvider';
import { useTranslation } from '../i18n';

export default function AdminProfessores({ theme }) {
  const t = useTranslation();
  const { notify, confirm } = useUI();
  const [professores, setProfessores] = useState([]);
  const [professorSelecionado, setProfessorSelecionado] = useState(null);
  const [erro, setErro] = useState(false); // falha de rede ou resposta !ok

  // Novo estado para a barra de pesquisa
  const [searchTerm, setSearchTerm] = useState('');

  const carregarProfessores = () => {
    setErro(false);
    apiFetch('/professores')
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(data => { if (Array.isArray(data)) setProfessores(data); })
      .catch(err => { console.error("Ups, problema ao carregar a equipa:", err); setErro(true); });
  };

  useEffect(() => {
    carregarProfessores();
  }, []);

  const handleEliminar = async (id, nome) => {
    const confirmacao = await confirm({
      title: t('adminx.profConfirmTitle'),
      message: t('adminx.profConfirmMsg').replace('{nome}', nome),
      confirmLabel: t('adminx.profRemove'),
      danger: true,
    });
    if (!confirmacao) return;

    try {
      const response = await apiFetch(`/professores/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (response.ok) {
        notify(data.mensagem || t('adminx.profRemoved'), 'success');
        carregarProfessores(); // Atualizamos a montra para refletir a saída
      } else {
        notify(data.erro || t('adminx.genericError'), 'error');
      }
    } catch {
      notify(t('adminx.networkError'), 'error');
    }
  };

  // Filtra os professores baseando-se no texto da barra de pesquisa
  const professoresFiltrados = useMemo(() => {
    if (!searchTerm) return professores;
    const lower = searchTerm.toLowerCase();
    return professores.filter(p => 
      p.nome.toLowerCase().includes(lower) || 
      p.email.toLowerCase().includes(lower)
    );
  }, [professores, searchTerm]);

  // ==========================================
  // VISTA 1: VER O PERFIL DO PROFESSOR
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
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            {t('adminx.profBack')}
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
  // ESTILOS DA PÁGINA (Baseado no ProfessorAlunos)
  // ==========================================
  const styles = {
    card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.inputBorder}40` },
    searchInput: { width: '100%', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg, color: theme.inputText, fontSize: '14px', marginBottom: '24px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: theme.textMain, fontSize: '14px' },
    th: { padding: '16px 12px', borderBottom: `2px solid ${theme.inputBorder}`, color: theme.textSub, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px', fontWeight: 'bold' },
    td: { padding: '16px 12px', borderBottom: `1px solid ${theme.inputBorder}60`, verticalAlign: 'middle' },
    avatar: { width: '42px', height: '42px', borderRadius: '50%', backgroundColor: theme.primary, backgroundImage: theme.gradient, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 },
    viewButton: { backgroundColor: `${theme.primary}15`, color: theme.primary, border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' },
    deleteButton: { backgroundColor: `${theme.danger}15`, color: theme.danger, border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }
  };

  // ==========================================
  // VISTA 2: PÁGINA DE TABELA DOS PROFESSORES 
  // ==========================================
  return (
    <div style={{ maxHeight: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: '10px' }}>
      
      <div style={styles.card}>
        
        {/* BARRA DE PESQUISA */}
        <input
          type="text"
          placeholder={t('adminx.profSearchPlaceholder')}
          aria-label={t('adminx.profSearchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
          onFocus={(e) => e.target.style.borderColor = theme.primary}
          onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
        />

        {erro ? (
           /* Bloco de erro com o mesmo visual dos estados vazios + botão de repetir */
           <div style={{ textAlign: 'center', padding: '40px 0' }}>
             <p style={{ color: theme.danger, fontWeight: 'bold', fontSize: '15px', margin: 0 }}>
               {t('adminx.loadError')}
             </p>
             <button
               type="button"
               onClick={carregarProfessores}
               style={{ backgroundColor: theme.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '12px' }}
             >
               {t('adminx.retry')}
             </button>
           </div>
        ) : professores.length === 0 ? (
           <p style={{ color: theme.textSub, textAlign: 'center', padding: '40px 0', fontSize: '15px' }}>
             {t('adminx.profEmpty')}
           </p>
        ) : professoresFiltrados.length === 0 ? (
           <p style={{ color: theme.textSub, textAlign: 'center', padding: '40px 0', fontSize: '15px' }}>
             {t('adminx.profSearchEmpty')}
           </p>
        ) : (
          <div className="cl-table-wrap">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t('admin.user')}</th>
                  <th style={styles.th}>{t('adminx.profColRegisto')}</th>
                  <th style={{...styles.th, textAlign: 'right'}}>{t('adminx.profColAcoes')}</th>
                </tr>
              </thead>
              <tbody>
                {professoresFiltrados.map(prof => (
                  <tr key={prof.id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.inputBg} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    
                    {/* COLUNA 1: FOTO, NOME E EMAIL */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.avatar}>
                          {prof.avatar ? (
                            <img src={prof.avatar} alt={t('adminx.profAvatarAlt').replace('{nome}', prof.nome)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            prof.nome.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: theme.textMain, fontSize: '14px', marginBottom: '2px' }}>{prof.nome}</div>
                          <div style={{ color: theme.textSub, fontSize: '12px' }}>{prof.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 2: DATA E ID */}
                    <td style={styles.td}>
                      <div style={{ color: theme.textMain, fontSize: '13px', fontWeight: '500' }}>{prof.data_registo}</div>
                      <div style={{ color: theme.textSub, fontSize: '11px', marginTop: '2px' }}>ID: #{prof.id}</div>
                    </td>

                    {/* COLUNA 3: BOTÕES DE AÇÃO */}
                    <td style={{...styles.td, textAlign: 'right'}}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        
                        <button 
                          onClick={() => setProfessorSelecionado(prof)}
                          style={styles.viewButton}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}25`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}15`}
                        >
                          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          {t('adminx.profView')}
                        </button>

                        <button 
                          onClick={() => handleEliminar(prof.id, prof.nome)}
                          style={styles.deleteButton}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}25`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.danger}15`}
                          title={t('adminx.profRemoveTitle')}
                        >
                          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          {t('adminx.profRemove')}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
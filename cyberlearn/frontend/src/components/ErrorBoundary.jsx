import { Component } from 'react';

// Última linha de defesa: uma exceção de render deixa de resultar em ecrã branco.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Erro de render apanhado pelo ErrorBoundary:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', backgroundColor: '#070b14', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '20px' }}>
        <span style={{ fontSize: '48px' }} aria-hidden="true">🛡️</span>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Algo correu mal</h1>
        <p style={{ margin: 0, color: '#94a3b8', maxWidth: '420px' }}>
          Ocorreu um erro inesperado na aplicação. Recarrega a página para continuar.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginTop: '8px', padding: '12px 28px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: 'white', background: 'linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%)' }}
        >
          Recarregar a página
        </button>
      </div>
    );
  }
}

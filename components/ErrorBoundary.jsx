'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { conError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { conError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error atrapado por ErrorBoundary:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.conError) {
      const msg = this.state.error ? (this.state.error.message || String(this.state.error)) : 'Error desconocido';
      const stack = (this.state.error && this.state.error.stack) || (this.state.info && this.state.info.componentStack) || '';
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '16px', fontFamily: 'sans-serif', textAlign: 'center', padding: '24px'
        }}>
          <p style={{ fontSize: '18px', fontWeight: 700 }}>⚠️ Algo salió mal</p>
          <p style={{ fontSize: '14px', opacity: 0.7, maxWidth: '400px' }}>
            Puede ser una actualización reciente de la app. Recargá la página para solucionarlo.
          </p>
          {/* Detalle del error — visible para poder diagnosticarlo (sacá el mensaje en una captura). */}
          <pre style={{
            maxWidth: 'min(680px, 92vw)', maxHeight: '260px', overflow: 'auto', textAlign: 'left',
            background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.4)', borderRadius: '10px',
            padding: '12px 14px', fontSize: '12px', color: '#f87171', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}>
            <b>{msg}</b>{stack ? '\n\n' + stack : ''}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

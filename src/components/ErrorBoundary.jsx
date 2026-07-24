import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Cadence App Error Boundary Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          color: '#33414A'
        }}>
          <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
          <h2>Something went wrong loading Cadence</h2>
          <p style={{ color: '#64748B', maxWidth: '400px', marginBottom: '1.5rem', fontSize: '14px' }}>
            A temporary display error occurred. Don't worry, your schedule and settings are safe.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#5F8467',
              color: '#FFF',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            Reload Cadence App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

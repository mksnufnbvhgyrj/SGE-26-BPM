import React, { ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if ((this as any).props.fallback) {
        return (this as any).props.fallback;
      }
      return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Erro no aplicativo</h2>
          <p className="text-slate-600 mb-6">Infelizmente o registro falhou. Por favor, recarregue para tentar novamente.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

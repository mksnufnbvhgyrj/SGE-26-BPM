import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      let isFirestoreError = false;
      let firestoreErrorDetails = null;

      try {
        // Try to parse as FirestoreErrorInfo
        const parsedError = JSON.parse(errorMessage);
        if (parsedError && parsedError.operationType) {
          isFirestoreError = true;
          firestoreErrorDetails = parsedError;
          errorMessage = `Firestore Error (${parsedError.operationType}): ${parsedError.error}`;
        }
      } catch (e) {
        // Not a JSON string, ignore
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops, something went wrong.</h1>
            <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6 font-mono text-sm overflow-auto">
              {errorMessage}
            </div>
            {isFirestoreError && firestoreErrorDetails && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Error Details</h2>
                <pre className="bg-gray-100 p-4 rounded-md text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(firestoreErrorDetails, null, 2)}
                </pre>
              </div>
            )}
            <button
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

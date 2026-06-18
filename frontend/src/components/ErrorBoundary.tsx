import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              An unexpected error occurred while rendering this section.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-400 mb-6 p-3 bg-gray-50 rounded-lg font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="btn-primary inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <Link
                to="/dashboard"
                onClick={this.handleRetry}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Hook to wrap a component or page with ErrorBoundary */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

/** Simple inline error fallback for data sections */
export function ErrorFallback({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card text-center py-12">
      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-gray-600 font-medium mb-1">
        {message || 'Failed to load data'}
      </p>
      <p className="text-sm text-gray-400 mb-4">
        An error occurred while fetching data. Please try again.
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary inline-flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      )}
    </div>
  );
}

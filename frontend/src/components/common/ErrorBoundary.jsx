import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logError } from '../../utils/errorHandling';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    const errorId = logError(error, {
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName || 'Unknown',
      props: this.props.errorContext || {}
    });

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetErrorBoundary: this.handleReset
        });
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full">
            <div className="bg-white shadow-lg rounded-lg p-6">
              {/* Error Icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>

              {/* Error Title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {this.props.title || 'Something went wrong'}
                </h1>
                <p className="text-gray-600">
                  {this.props.message || 
                    'An unexpected error occurred. Our team has been notified and is working to fix this issue.'
                  }
                </p>
              </div>

              {/* Error ID */}
              {this.state.errorId && (
                <div className="bg-gray-50 rounded-md p-3 mb-6">
                  <div className="flex items-center">
                    <Bug className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Error ID: <code className="font-mono text-xs">{this.state.errorId}</code>
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </button>
                </div>
              </div>

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-3 p-3 bg-gray-100 rounded-md">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Error Message:</h4>
                      <p className="text-sm text-red-600 font-mono">{this.state.error.message}</p>
                    </div>
                    
                    {this.state.error.stack && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Stack Trace:</h4>
                        <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Component Stack:</h4>
                        <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Contact Support */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                  If this problem persists, please{' '}
                  <a 
                    href="mailto:support@geminicrm.com" 
                    className="text-blue-600 hover:text-blue-500"
                  >
                    contact support
                  </a>
                  {this.state.errorId && (
                    <span> and include the error ID above.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for programmatically triggering error boundary
export const useErrorBoundary = () => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);

  return captureError;
};

export default ErrorBoundary;

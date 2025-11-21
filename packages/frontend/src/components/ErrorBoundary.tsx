import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * This helps prevent the "Failed to Load" error by providing graceful
 * error handling and helpful error messages to users.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Store error info in state for display
    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to log this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    // Reset error state and reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page to recover
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl w-full p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-6 w-6 text-red-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Application Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    We're sorry, but something went wrong while loading the application. 
                    This is likely a temporary issue.
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                      What you can do:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                      <li>Click the "Reload Application" button below</li>
                      <li>Clear your browser cache and cookies</li>
                      <li>Try a different browser</li>
                      <li>Check your internet connection</li>
                      <li>Contact support if the problem persists</li>
                    </ul>
                  </div>

                  {/* Show error details in development mode */}
                  {import.meta.env.DEV && this.state.error && (
                    <details className="mt-4 p-3 bg-red-100 dark:bg-red-900/40 rounded text-xs">
                      <summary className="cursor-pointer font-semibold text-red-900 dark:text-red-100 mb-2">
                        Technical Details (Development Mode)
                      </summary>
                      <div className="space-y-2">
                        <div>
                          <strong className="text-red-900 dark:text-red-100">Error:</strong>
                          <pre className="mt-1 text-red-800 dark:text-red-200 whitespace-pre-wrap break-words">
                            {this.state.error.toString()}
                          </pre>
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <strong className="text-red-900 dark:text-red-100">Component Stack:</strong>
                            <pre className="mt-1 text-red-800 dark:text-red-200 whitespace-pre-wrap break-words">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={this.handleReset}
                      className="btn btn-primary"
                    >
                      Reload Application
                    </button>
                    <a
                      href="/login"
                      className="btn btn-secondary"
                    >
                      Go to Login
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

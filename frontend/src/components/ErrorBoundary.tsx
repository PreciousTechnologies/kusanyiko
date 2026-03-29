import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const quietRedirectToLogin = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  if (window.location.hash !== '#/login') {
    window.location.replace('#/login');
  }
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Check if it's an authentication error
    const isAuthError = error.message?.includes('401') || 
                        error.message?.includes('403') ||
                        error.message?.includes('Unauthorized') ||
                        error.message?.includes('Session expired');
    
    if (isAuthError) {
      quietRedirectToLogin();
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a 404 or auth-related error
      const errorMessage = this.state.error?.message || '';
      const isNotFound = errorMessage.includes('404') || errorMessage.includes('Not Found');
      const isAuthError = errorMessage.includes('401') || 
                         errorMessage.includes('403') ||
                         errorMessage.includes('Unauthorized');
      
      if (isNotFound || isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="text-center">
              <div className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Your session ended. Please sign in again.</p>
              <button
                onClick={quietRedirectToLogin}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                Go to Login
              </button>
            </div>
          </div>
        );
      }
      
      // Generic error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. You can try again without reloading.
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

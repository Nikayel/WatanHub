import React from 'react';
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';

class AuthErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            isOnline: navigator.onLine
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidMount() {
        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    componentWillUnmount() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
    }

    handleOnline = () => {
        this.setState({ isOnline: true });
        // Auto retry if we were offline
        if (this.state.hasError && !this.state.isOnline) {
            setTimeout(() => this.handleRetry(), 1000);
        }
    };

    handleOffline = () => {
        this.setState({ isOnline: false });
    };

    componentDidCatch(error, errorInfo) {
        console.error('Auth Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log to your error reporting service
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.toString(),
                fatal: false
            });
        }
    }

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1
        }));

        // Clear any auth state and try to refresh
        if (this.state.retryCount < 2) {
            window.location.reload();
        }
    };

    handleGoHome = () => {
        // Clear any auth state and go to home
        localStorage.clear();
        window.location.href = '/';
    };

    handleClearAndLogin = () => {
        // Clear storage and redirect to login
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
    };

    render() {
        if (this.state.hasError) {
            const isNetworkError = this.state.error?.message?.includes('network') ||
                this.state.error?.message?.includes('fetch') ||
                this.state.error?.message?.includes('timeout');

            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                                {/* Connection status indicator */}
                                <div className="flex justify-center mb-4">
                                    {this.state.isOnline ? (
                                        <Wifi className="h-8 w-8 text-green-500" />
                                    ) : (
                                        <WifiOff className="h-8 w-8 text-red-500" />
                                    )}
                                    <AlertTriangle className="h-8 w-8 text-amber-500 ml-2" />
                                </div>

                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {isNetworkError ? 'Connection Issue' : 'Authentication Error'}
                                </h2>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    {!this.state.isOnline
                                        ? 'You appear to be offline. Please check your internet connection.'
                                        : isNetworkError
                                            ? 'There seems to be a network issue. This is usually temporary.'
                                            : 'Something went wrong with authentication. This is usually temporary.'
                                    }
                                </p>

                                {/* Connection status */}
                                <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <div className="flex items-center justify-center gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${this.state.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {this.state.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* Auto retry for network issues */}
                                    {isNetworkError && this.state.isOnline && (
                                        <button
                                            onClick={this.handleRetry}
                                            disabled={this.state.retryCount >= 3}
                                            className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${this.state.retryCount >= 3
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            {this.state.retryCount >= 3 ? 'Max Retries Reached' : `Retry (${this.state.retryCount}/3)`}
                                        </button>
                                    )}

                                    {/* Clear and retry */}
                                    <button
                                        onClick={this.handleClearAndLogin}
                                        className="w-full flex justify-center items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Home className="h-4 w-4 mr-2" />
                                        Clear Data & Sign In
                                    </button>

                                    {/* Go home as fallback */}
                                    <button
                                        onClick={this.handleGoHome}
                                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Home className="h-4 w-4 mr-2" />
                                        Go to Home Page
                                    </button>
                                </div>

                                {/* Debug info in development */}
                                {process.env.NODE_ENV === 'development' && (
                                    <details className="mt-6 text-left">
                                        <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                                            {this.state.error?.toString()}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AuthErrorBoundary; 
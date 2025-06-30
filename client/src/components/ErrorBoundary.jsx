import React from 'react';
import { AlertTriangle, RefreshCw, Home, Settings, Download } from 'lucide-react';
import { cacheManager } from '../lib/CacheManager';
import Logger from '../utils/logger';
import config from '../config/environment';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            infiniteLoadingDetected: false
        };

        this.loadingCheckInterval = null;
        this.loadingStartTime = Date.now();
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidMount() {
        // Detect potential infinite loading states
        this.loadingCheckInterval = setInterval(() => {
            const loadingElements = document.querySelectorAll('[data-loading="true"], .animate-spin');
            const now = Date.now();

            if (loadingElements.length > 0 && (now - this.loadingStartTime) > 30000) {
                console.warn('⚠️ Potential infinite loading detected');
                this.setState({ infiniteLoadingDetected: true });
                clearInterval(this.loadingCheckInterval);
            }
        }, 5000);
    }

    componentWillUnmount() {
        if (this.loadingCheckInterval) {
            clearInterval(this.loadingCheckInterval);
        }
    }

    componentDidCatch(error, errorInfo) {
        const errorId = this.generateErrorId();

        this.setState({
            error,
            errorInfo,
            errorId
        });

        // Log error details
        Logger.error('React Error Boundary caught an error:', {
            errorId,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // In production, send to error tracking service
        if (config.isProduction) {
            this.reportToErrorService(error, errorInfo, errorId);
        }
    }

    generateErrorId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    reportToErrorService = async (error, errorInfo, errorId) => {
        try {
            // This would integrate with your error tracking service
            // Example: Sentry, LogRocket, Bugsnag, etc.
            await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    errorId,
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    userId: this.props.userId || 'anonymous'
                })
            });
        } catch (reportingError) {
            Logger.error('Failed to report error to service:', reportingError);
        }
    };

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            infiniteLoadingDetected: false,
            retryCount: prevState.retryCount + 1
        }));

        // Clear cache on retry
        if (this.state.retryCount > 0) {
            cacheManager.emergencyClear();
        }

        window.location.reload();
    };

    handleEmergencyReset = () => {
        // Nuclear option - clear everything and restart
        cacheManager.emergencyClear();

        // Clear all auth tokens
        localStorage.clear();
        sessionStorage.clear();

        // Clear service worker cache
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => registration.unregister());
            });
        }

        // Redirect to home
        window.location.href = '/';
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError || this.state.infiniteLoadingDetected) {
            const isLoadingIssue = this.state.infiniteLoadingDetected;

            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />

                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {isLoadingIssue ? 'Loading Issue Detected' : 'Something Went Wrong'}
                                </h2>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    {isLoadingIssue
                                        ? 'The app seems to be stuck loading. This usually happens due to connectivity issues or browser cache problems.'
                                        : 'We encountered an unexpected error. This is usually temporary and can be fixed with a simple refresh.'
                                    }
                                </p>

                                {/* Error details for developers */}
                                {this.state.error && process.env.NODE_ENV === 'development' && (
                                    <details className="mb-6 text-left">
                                        <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                                            Error Details (Development)
                                        </summary>
                                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                            {this.state.error.toString()}
                                        </pre>
                                    </details>
                                )}

                                {/* Action buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={this.handleRetry}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Try Again
                                    </button>

                                    <button
                                        onClick={this.handleGoHome}
                                        className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                                    >
                                        <Home className="h-4 w-4 mr-2" />
                                        Go to Home
                                    </button>

                                    {(this.state.retryCount > 1 || isLoadingIssue) && (
                                        <button
                                            onClick={this.handleEmergencyReset}
                                            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Emergency Reset
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 mt-4">
                                    If problems persist, try clearing your browser cache or contact support.
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

// Higher-order component for easier usage
export const withErrorBoundary = (Component, errorFallback) => {
    return function WrappedComponent(props) {
        return (
            <ErrorBoundary fallback={errorFallback} userId={props.userId}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
};

export default ErrorBoundary; 
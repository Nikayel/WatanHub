import React from 'react';
import Logger from '../utils/logger';
import config from '../config/environment';

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
        return { hasError: true };
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

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const { fallback: Fallback } = this.props;

            if (Fallback) {
                return (
                    <Fallback
                        error={this.state.error}
                        errorInfo={this.state.errorInfo}
                        errorId={this.state.errorId}
                        onReload={this.handleReload}
                        onGoHome={this.handleGoHome}
                    />
                );
            }

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-8 w-8 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h1 className="text-lg font-semibold text-gray-900">
                                    Something went wrong
                                </h1>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                We apologize for the inconvenience. An unexpected error occurred while loading this page.
                            </p>

                            {config.isDevelopment && this.state.error && (
                                <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                                    <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                                        Error Details (Development)
                                    </summary>
                                    <div className="text-red-600 font-mono whitespace-pre-wrap">
                                        {this.state.error.message}
                                        {'\n\n'}
                                        {this.state.error.stack}
                                    </div>
                                </details>
                            )}

                            {this.state.errorId && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Error ID: {this.state.errorId}
                                </p>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                            >
                                Go Home
                            </button>
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
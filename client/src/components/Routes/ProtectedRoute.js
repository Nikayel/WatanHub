import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { Loader2, Shield } from "lucide-react";

const ProtectedRoute = ({ children }) => {
    const { user, loading, isAdmin, isMentor, error } = useAuth();
    const [timeoutReached, setTimeoutReached] = useState(false);

    // Add timeout for loading state to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('ProtectedRoute: Loading timeout reached');
                setTimeoutReached(true);
            }
        }, 25000); // 25 second timeout - aligned with AuthContext

        return () => clearTimeout(timer);
    }, [loading]);

    // Enhanced loading component with timeout handling
    if (loading && !timeoutReached) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="flex flex-col items-center space-y-4 text-white">
                    <div className="relative">
                        <Shield className="h-12 w-12 text-indigo-400" />
                        <Loader2 className="h-6 w-6 text-indigo-300 animate-spin absolute -top-1 -right-1" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-medium">Verifying Access</h3>
                        <p className="text-sm text-gray-300 mt-1">Checking your authentication...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Handle timeout case
    if (timeoutReached || (loading && timeoutReached)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto text-center">
                    <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Authentication Timeout
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Authentication is taking longer than expected. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    // Handle authentication errors
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto text-center">
                    <div className="text-red-500 mb-4">
                        <Shield className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Authentication Error
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {error}
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!user) {
        console.log('ProtectedRoute: No user found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Redirect admins to the admin dashboard
    if (isAdmin) {
        console.log('ProtectedRoute: Admin user detected, redirecting to admin dashboard');
        return <Navigate to="/admin/dashboard" replace />;
    }

    // Redirect mentors to the mentor dashboard
    if (isMentor) {
        console.log('ProtectedRoute: Mentor user detected, redirecting to mentor dashboard');
        return <Navigate to="/mentor/dashboard" replace />;
    }

    console.log('ProtectedRoute: User authenticated, rendering protected content');
    return children;
}

export default ProtectedRoute;

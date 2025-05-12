import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect admins to the admin dashboard
    if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
}
export default ProtectedRoute;

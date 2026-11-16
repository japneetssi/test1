import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, isAuthenticated, isHydrated } = useAuth();
    const location = useLocation();

    // Wait for AuthContext to finish reading from localStorage.
    // Return loading state instead of null to prevent premature redirects
    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#00458c] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <span className="text-sm text-gray-600">Restoring session...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        // Redirect to a safe default page if unauthorized
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

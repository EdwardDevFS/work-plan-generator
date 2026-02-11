import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  viewKey?: string;
  requiredPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  viewKey,
  requiredPath
}) => {
  const { isAuthenticated, isLoading, hasAccessToView, hasAccessToPath } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (viewKey && !hasAccessToView(viewKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPath && !hasAccessToPath(requiredPath)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
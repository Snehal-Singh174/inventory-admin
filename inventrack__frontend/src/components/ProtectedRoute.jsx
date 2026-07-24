import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { toast } from 'sonner';

const ROLE_MESSAGES = {
  '/audit-log': "You don't have permission to view the audit log.",
  '/users': "You don't have permission to manage users.",
};

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const message = ROLE_MESSAGES[location.pathname] || 'You do not have access to this page.';
    toast.error(message);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

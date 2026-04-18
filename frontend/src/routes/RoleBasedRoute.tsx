import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../auth/types';
import { hasRole } from '../auth/rbac';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * FR-010: Role-Based Route Protection
 * Protects routes based on user role
 * Redirects unauthorized users to specified path
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/' 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // FR-010: Check if user has required role
  if (!hasRole(user?.role, allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

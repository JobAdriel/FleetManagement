import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { AuthUser } from '../contexts/AuthContext';

interface RoleBasedRouteProps {
  children?: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export const RoleBasedRoute = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
}: RoleBasedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles.length > 0) {
    const userRoles = (user as AuthUser | null)?.roles_names || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#c00' }}>
          <h2>Access Denied</h2>
          <p>You do not have the required role to access this page.</p>
          <a href="/">Return to Dashboard</a>
        </div>
      );
    }
  }

  if (requiredPermissions.length > 0) {
    const userPermissions = (user as AuthUser | null)?.permissions_names || [];
    const hasRequiredPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasRequiredPermission) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#c00' }}>
          <h2>Access Denied</h2>
          <p>You do not have the required permissions to access this page.</p>
          <a href="/">Return to Dashboard</a>
        </div>
      );
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleBasedRoute;

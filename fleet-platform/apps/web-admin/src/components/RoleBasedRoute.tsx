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
  const authUser = user as AuthUser | null;
  const userRoles = authUser?.roles_names || [];
  const userPermissions = authUser?.permissions_names || [];

  const isAdmin = userRoles.some((role) => {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'super_admin';
  });

  const hasWildcardPermission = userPermissions.includes('*');

  if (isLoading) {
    return <div className="route-message">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = isAdmin || requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div className="route-message route-message-error">
          <h2>Access Denied</h2>
          <p>You do not have the required role to access this page.</p>
          <a href="/">Return to Dashboard</a>
        </div>
      );
    }
  }

  if (requiredPermissions.length > 0) {
    const hasRequiredPermission =
      isAdmin ||
      hasWildcardPermission ||
      requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasRequiredPermission) {
      return (
        <div className="route-message route-message-error">
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

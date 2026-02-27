import { useAuth } from '../contexts/AuthContext';
import type { AuthUser } from '../contexts/AuthContext';

export const usePermission = () => {
  const { user } = useAuth();
  const typedUser = user as AuthUser | null;

  const hasPermission = (permission: string): boolean => {
    if (!typedUser) return false;
    const userRoles = typedUser.roles_names || [];
    const userPermissions = typedUser.permissions_names || [];

    if (userRoles.some(role => {
      const normalizedRole = role.toLowerCase();
      return normalizedRole === 'admin' || normalizedRole === 'super_admin';
    })) return true;
    if (userPermissions.includes('*')) return true;

    return userPermissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!typedUser) return false;
    return typedUser.roles_names?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!typedUser) return false;
    const userRoles = typedUser.roles_names || [];
    return roles.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    if (!typedUser) return false;
    const userRoles = typedUser.roles_names || [];
    return roles.every(role => userRoles.includes(role));
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
};

export default usePermission;

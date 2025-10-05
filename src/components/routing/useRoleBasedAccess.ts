import { useAuth } from '@/contexts/auth';
import { UserRoleType } from '@/types/user';

/**
 * Hook do sprawdzania czy użytkownik może uzyskać dostęp do danej ścieżki
 */
export const useRoleBasedAccess = () => {
  const { user } = useAuth();

  const canAccess = (requiredRoles: UserRoleType[]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.role as UserRoleType);
  };

  const canAccessAdmin = (): boolean => {
    return canAccess(['super_admin', 'system_admin', 'admin']);
  };

  const canAccessDashboard = (): boolean => {
    return canAccess(['super_admin', 'system_admin', 'admin', 'manager', 'member']);
  };

  const canAccessProfile = (): boolean => {
    return canAccess(['super_admin', 'system_admin', 'admin', 'manager', 'member', 'guest']);
  };

  return {
    canAccess,
    canAccessAdmin,
    canAccessDashboard,
    canAccessProfile,
    userRole: user?.role as UserRoleType,
  };
};

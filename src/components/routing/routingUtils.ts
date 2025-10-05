import { UserRoleType } from '@/types/user';

/**
 * Funkcja pomocnicza do określenia ścieżki przekierowania na podstawie roli
 */
export const getRedirectPathForRole = (role: UserRoleType): string => {
  switch (role) {
    case 'super_admin':
    case 'system_admin':
      // Super admin i system admin -> Panel administracyjny
      return '/admin';
      
    case 'admin':
      // Admin -> Panel administracyjny (ale może mieć ograniczone uprawnienia)
      return '/admin';
      
    case 'manager':
      // Manager -> Dashboard z uprawnieniami zarządzania
      return '/dashboard';
      
    case 'member':
      // Member -> Dashboard z podstawowymi uprawnieniami
      return '/dashboard';
      
    case 'guest':
    default:
      // Guest -> Profil (ograniczony dostęp)
      return '/profile';
  }
};

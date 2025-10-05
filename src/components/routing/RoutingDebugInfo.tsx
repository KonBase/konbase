import React from 'react';
import { useAuth } from '@/contexts/auth';
import { useRoleBasedAccess, getRedirectPathForRole } from './index';
import { UserRoleType } from '@/types/user';

/**
 * Komponent do debugowania routingu - pokazuje informacje o roli użytkownika
 * i dostępnych ścieżkach. Użyj tylko w trybie deweloperskim.
 */
export const RoutingDebugInfo: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { canAccessAdmin, canAccessDashboard, canAccessProfile, userRole } = useRoleBasedAccess();

  // Pokaż tylko w trybie deweloperskim
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm">
        <h3 className="font-bold mb-2">🔍 Routing Debug</h3>
        <p>Status: Niezalogowany</p>
        <p>Przekierowanie: /login</p>
      </div>
    );
  }

  const redirectPath = getRedirectPathForRole(userRole as UserRoleType);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">🔍 Routing Debug</h3>
      <div className="space-y-1">
        <p><strong>Użytkownik:</strong> {user.email}</p>
        <p><strong>Rola:</strong> {userRole}</p>
        <p><strong>Przekierowanie:</strong> {redirectPath}</p>
        <div className="border-t pt-2 mt-2">
          <p><strong>Dostęp:</strong></p>
          <p>• Admin: {canAccessAdmin() ? '✅' : '❌'}</p>
          <p>• Dashboard: {canAccessDashboard() ? '✅' : '❌'}</p>
          <p>• Profile: {canAccessProfile() ? '✅' : '❌'}</p>
        </div>
      </div>
    </div>
  );
};

export default RoutingDebugInfo;

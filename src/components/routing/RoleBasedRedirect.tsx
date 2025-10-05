import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRoleType } from '@/types/user';
import { getRedirectPathForRole } from './routingUtils';

/**
 * Komponent do inteligentnego przekierowania użytkowników na podstawie ich roli
 * po zalogowaniu. Przekierowuje do odpowiedniego panelu w zależności od uprawnień.
 */
export const RoleBasedRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Jeśli jeszcze ładuje się autoryzacja, pokaż loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  // Jeśli użytkownik nie jest zalogowany, przekieruj do logowania
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Przekieruj na podstawie roli użytkownika
  const redirectPath = getRedirectPathForRole(user.role as UserRoleType);
  
  return <Navigate to={redirectPath} replace />;
};



export default RoleBasedRedirect;

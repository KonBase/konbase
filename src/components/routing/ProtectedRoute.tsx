import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRoleType } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRoleType[];
  fallbackPath?: string;
  requireAuth?: boolean;
}

/**
 * Komponent do ochrony tras na podstawie autoryzacji i ról użytkowników
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/login',
  requireAuth = true,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Jeśli jeszcze ładuje się autoryzacja, pokaż loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Jeśli wymagana jest autoryzacja ale użytkownik nie jest zalogowany
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Jeśli użytkownik jest zalogowany ale nie ma wymaganych ról
  if (isAuthenticated && requiredRoles.length > 0) {
    const userRole = user?.role as UserRoleType;
    
    if (!userRole || !requiredRoles.includes(userRole)) {
      // Przekieruj do odpowiedniego panelu na podstawie roli użytkownika
      const redirectPath = getRedirectPathForRole(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Jeśli wszystko jest OK, wyrenderuj dzieci
  return <>{children}</>;
};

/**
 * Funkcja pomocnicza do określenia ścieżki przekierowania na podstawie roli
 */
const getRedirectPathForRole = (role: UserRoleType): string => {
  switch (role) {
    case 'super_admin':
    case 'system_admin':
    case 'admin':
      return '/admin';
    case 'manager':
    case 'member':
      return '/dashboard';
    case 'guest':
    default:
      return '/profile';
  }
};

/**
 * Komponent do tras publicznych (dostępnych bez logowania)
 */
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Jeśli jeszcze ładuje się autoryzacja, pokaż loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Jeśli użytkownik jest już zalogowany, przekieruj do odpowiedniego panelu
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { UserRoleType } from '@/types/user';

interface RoleBasedRedirectProps {
  component: ReactNode;
  allowedRoles: UserRoleType[];
  redirectTo: string;
}

export const RoleBasedRedirect = ({
  component,
  allowedRoles,
  redirectTo,
}: RoleBasedRedirectProps) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile) {
      // Check if user has one of the allowed roles
      const hasAllowedRole = allowedRoles.includes(
        userProfile.role as UserRoleType,
      );

      if (!hasAllowedRole) {
        router.push(redirectTo);
      }
    }
  }, [userProfile, loading, allowedRoles, redirectTo, router]);

  return <>{component}</>;
};

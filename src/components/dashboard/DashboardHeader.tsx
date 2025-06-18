'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { Association } from '@/types/association';
import { User } from '@/types/user';
import { useUserProfile } from '@/hooks/useUserProfile';

interface DashboardHeaderProps {
  currentAssociation: Association | null;
  user: User | null;
  isHome: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentAssociation,
  user,
}) => {
  const { profile } = useUserProfile();
  const isAdmin =
    profile?.role === 'super_admin' || profile?.role === 'system_admin';

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {currentAssociation ? (
            <p className="text-muted-foreground flex items-center">
              <Building2 className="h-4 w-4 mr-1 inline-block" />
              {currentAssociation.name} - Welcome back, {user?.name || 'User'}!
            </p>
          ) : (
            <p className="text-muted-foreground flex items-center">
              <Building2 className="h-4 w-4 mr-1 inline-block" />
              No association selected
            </p>
          )}
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              System administration mode enabled
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

'use client';

import React from 'react';
import NoAssociationView from '@/components/dashboard/NoAssociationView';
import DashboardDebugPanel from '@/components/dashboard/DashboardDebugPanel';

interface DashboardEmptyStateProps {
  networkStatus: any;
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  user: any;
  currentAssociation: any;
  handleRetry: () => void;
  lastError: any;
  retryCount: number;
}

const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  networkStatus,
  isDebugMode,
  toggleDebugMode,
  user,
  currentAssociation,
  handleRetry,
  lastError,
  retryCount,
}) => {
  return (
    <div className="container mx-auto py-6">
      <NoAssociationView />
      <DashboardDebugPanel
        isDebugMode={isDebugMode}
        toggleDebugMode={toggleDebugMode}
        networkStatus={networkStatus}
        user={user}
        currentAssociation={currentAssociation}
        lastError={lastError}
        handleRetry={handleRetry}
        retryCount={retryCount}
      />
    </div>
  );
};

export default DashboardEmptyState;

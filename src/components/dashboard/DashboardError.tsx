'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LoadingError } from '@/components/ui/spinner';
import { AlertTriangle } from 'lucide-react';
import DebugModeToggle from '@/components/dashboard/DebugModeToggle';
import DebugPanel from '@/utils/debug-panel';
import { User } from '@/types/user';
import { Association } from '@/types/association';

interface DashboardErrorProps {
  error: any;
  handleRetry: () => void;
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  networkStatus: any;
  user: User | null;
  currentAssociation: Association | null;
  lastError: any;
  retryCount: number;
}

const DashboardError: React.FC<DashboardErrorProps> = ({
  error,
  handleRetry,
  isDebugMode,
  toggleDebugMode,
  networkStatus,
  user,
  currentAssociation,
  lastError,
  retryCount,
}) => {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading dashboard</AlertTitle>
        <AlertDescription>
          There was a problem loading your dashboard data. Please try again.
        </AlertDescription>
      </Alert>

      <LoadingError error={error} retry={handleRetry} />

      <DebugModeToggle
        isDebugMode={isDebugMode}
        toggleDebugMode={toggleDebugMode}
      />

      {isDebugMode && (
        <DebugPanel
          networkStatus={networkStatus.status}
          testConnection={networkStatus.testConnection}
          isTestingConnection={networkStatus.isTestingConnection}
          lastTestedAt={networkStatus.lastTestedAt}
          testResults={networkStatus.testResults}
          userData={{
            userId: user?.id,
            associationId: currentAssociation?.id,
          }}
          errorData={error}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

export default DashboardError;

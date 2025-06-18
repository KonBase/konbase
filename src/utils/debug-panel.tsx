import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bug } from 'lucide-react';
import { logDebug as _logDebug } from '@/utils/debug';

// Import refactored components
import DebugPanelHeader from '@/utils/debug/debug-panel-header';
import DebugActionButtons from '@/utils/debug/debug-action-buttons';
import TestConnectionSection from '@/utils/debug/test-connection-section';
import RequestInfoDisplay from '@/utils/debug/request-info-display';
import ErrorDetails from '@/utils/debug/error-details';
import DebugPanelFooter from '@/utils/debug/debug-panel-footer';

interface DebugPanelProps {
  networkStatus: 'online' | 'offline';
  requestInfo?: {
    requestTimestamp?: number | null;
    responseTimestamp?: number | null;
    retryCount?: number;
  };
  userData?: {
    userId?: string;
    associationId?: string;
  };
  errorData?: any;
  onRetry?: () => void;
  testConnection?: () => Promise<boolean | null>;
  isTestingConnection?: boolean;
  lastTestedAt?: number | null;
  testResults?: {
    success: boolean;
    timestamp: number;
    error?: Error;
  } | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  networkStatus,
  requestInfo,
  userData,
  errorData,
  onRetry,
  testConnection,
  isTestingConnection,
  lastTestedAt,
  testResults,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorCount, setErrorCount] = useState<number>(0);

  // Track error count to show a warning if errors are increasing
  useEffect(() => {
    if (errorData) {
      setErrorCount((prev) => prev + 1);
    }
  }, [errorData]);

  // Reset error count when network status changes to online
  useEffect(() => {
    if (networkStatus === 'online') {
      setErrorCount(0);
    }
  }, [networkStatus]);

  return (
    <Alert variant="default" className="mt-4 text-xs">
      <Bug className="h-4 w-4" />

      <DebugPanelHeader
        networkStatus={networkStatus}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        errorCount={errorCount}
        isTestingConnection={isTestingConnection}
      />

      {isExpanded && (
        <AlertDescription className="space-y-2 mt-2">
          <DebugActionButtons
            onRetry={onRetry}
            testConnection={testConnection}
            isTestingConnection={isTestingConnection}
          />

          <TestConnectionSection
            isTestingConnection={isTestingConnection}
            testConnection={testConnection}
            lastTestedAt={lastTestedAt}
            testResults={testResults}
          />

          <RequestInfoDisplay
            userData={userData}
            requestInfo={requestInfo}
            networkStatus={networkStatus}
          />

          <ErrorDetails errorData={errorData} />

          <DebugPanelFooter />
        </AlertDescription>
      )}
    </Alert>
  );
};

export default DebugPanel;

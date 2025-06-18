import React from 'react';
import { Button } from '@/components/ui/button';
import { Wifi } from 'lucide-react';

interface TestConnectionSectionProps {
  isTestingConnection?: boolean;
  testConnection?: () => Promise<boolean | null>;
  lastTestedAt?: number | null;
  testResults?: {
    success: boolean;
    timestamp: number;
    error?: Error;
  } | null;
}

export const TestConnectionSection: React.FC<TestConnectionSectionProps> = ({
  isTestingConnection,
  testConnection,
  lastTestedAt,
  testResults,
}) => {
  // Format time elapsed since last test
  const formatTimeElapsed = () => {
    if (!lastTestedAt) return 'Never';
    const elapsed = Date.now() - lastTestedAt;
    if (elapsed < 60000) return `${Math.floor(elapsed / 1000)}s ago`;
    return `${Math.floor(elapsed / 60000)}m ago`;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold flex justify-between items-center">
        <span>Connection Status</span>
        <span className="text-muted-foreground">
          Last checked: {formatTimeElapsed()}
        </span>
      </div>

      {testResults && (
        <div
          className={`text-xs p-1 rounded ${testResults.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
        >
          <div className="flex justify-between">
            <span>
              Connection test: {testResults.success ? 'Successful' : 'Failed'}
            </span>
            <span>{new Date(testResults.timestamp).toLocaleTimeString()}</span>
          </div>
          {testResults.error && (
            <div className="mt-1 text-xs overflow-hidden text-ellipsis">
              Error: {testResults.error.message}
            </div>
          )}
        </div>
      )}

      {testConnection && (
        <Button
          size="sm"
          variant="outline"
          onClick={testConnection}
          disabled={isTestingConnection}
          className="h-7 text-xs mt-2"
        >
          <Wifi className="h-3 w-3 mr-1" />
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
      )}
    </div>
  );
};

export default TestConnectionSection;

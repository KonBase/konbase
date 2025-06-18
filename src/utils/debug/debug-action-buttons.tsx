import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug, RefreshCw, Wifi, Trash2, ToggleLeft } from 'lucide-react';
import {
  enableDebugMode,
  logDebug,
  clearDebugLogs,
  isDebugModeEnabled,
} from '@/utils/debug';

interface DebugActionButtonsProps {
  onRetry?: () => void;
  testConnection?: () => Promise<boolean | null>;
  isTestingConnection?: boolean;
  showClearLogsButton?: boolean;
  showToggleButton?: boolean;
}

/**
 * Debug panel action buttons for common debugging operations
 */
export const DebugActionButtons: React.FC<DebugActionButtonsProps> = ({
  onRetry,
  testConnection,
  isTestingConnection,
  showClearLogsButton = true,
  showToggleButton = true,
}) => {
  const isDebugMode = isDebugModeEnabled();

  const handleEnableDebugMode = () => {
    enableDebugMode(true);
    logDebug('Debug mode enabled via debug panel', null, 'info');
    // Reload the page to ensure all components respect the new debug setting
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDisableDebugMode = () => {
    enableDebugMode(false);
    // Reload the page to ensure all components respect the new debug setting
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleClearLogs = () => {
    clearDebugLogs();
  };

  const handleTestConnection = async () => {
    if (!testConnection || isTestingConnection) return;

    try {
      const result = await testConnection();
      logDebug('Manual connection test result', { success: result }, 'info');
    } catch (error) {
      logDebug('Manual connection test error', error, 'error');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="h-7 text-xs"
          disabled={isTestingConnection}
        >
          <RefreshCw
            className={`h-3 w-3 mr-1 ${isTestingConnection ? 'animate-spin' : ''}`}
          />
          Retry
        </Button>
      )}

      {testConnection && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTestingConnection}
          className="h-7 text-xs"
        >
          <Wifi className="h-3 w-3 mr-1" />
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
      )}

      {showClearLogsButton && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleClearLogs}
          className="h-7 text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear Logs
        </Button>
      )}

      {showToggleButton &&
        (isDebugMode ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDisableDebugMode}
            className="h-7 text-xs text-destructive hover:text-destructive"
          >
            <ToggleLeft className="h-3 w-3 mr-1" />
            Disable Debug Mode
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleEnableDebugMode}
            className="h-7 text-xs"
          >
            <Bug className="h-3 w-3 mr-1" />
            Enable Debug Mode
          </Button>
        ))}
    </div>
  );
};

export default DebugActionButtons;

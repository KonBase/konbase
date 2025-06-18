import React from 'react';
import { AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface DebugPanelHeaderProps {
  networkStatus: 'online' | 'offline';
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  errorCount: number;
  isTestingConnection?: boolean;
}

export const DebugPanelHeader: React.FC<DebugPanelHeaderProps> = ({
  networkStatus,
  isExpanded,
  setIsExpanded,
  errorCount,
  isTestingConnection,
}) => {
  return (
    <AlertTitle className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>Debug Panel</span>
        <Badge
          variant={networkStatus === 'online' ? 'outline' : 'destructive'}
          className="text-xs"
        >
          {networkStatus === 'online' ? (
            <Wifi className="h-3 w-3 mr-1" />
          ) : (
            <WifiOff className="h-3 w-3 mr-1" />
          )}
          {networkStatus}
        </Badge>
        {errorCount > 3 && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Multiple Errors
          </Badge>
        )}
        {isTestingConnection && (
          <Badge variant="secondary" className="text-xs animate-pulse">
            Testing...
          </Badge>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </AlertTitle>
  );
};

export default DebugPanelHeader;

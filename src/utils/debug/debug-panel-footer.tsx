import React from 'react';
import { Info } from 'lucide-react';

const DebugPanelFooter: React.FC = () => {
  return (
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>Rate Limit: 10 req/sec</span>
      <span>
        <Info className="h-3 w-3 inline mr-1" />
        ERR_INSUFFICIENT_RESOURCES indicates rate limiting
      </span>
    </div>
  );
};

export default DebugPanelFooter;

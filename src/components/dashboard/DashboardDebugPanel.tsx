'use client';

import React, { useState } from 'react';
import DebugModeToggle from '@/components/dashboard/DebugModeToggle';
import DebugPanel from '@/utils/debug-panel';
import { User } from '@/types/user';
import { Association } from '@/types/association';
import DashboardPerformanceDebug from '@/components/dashboard/DashboardPerformanceDebug';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardDebugPanelProps {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  networkStatus: any;
  user: User | null;
  currentAssociation: Association | null;
  lastError: any;
  handleRetry: () => void;
  retryCount: number;
  loadTime?: number;
  requestInfo?: {
    requestTimestamp?: number | null;
    responseTimestamp?: number | null;
  };
}

const DashboardDebugPanel: React.FC<DashboardDebugPanelProps> = ({
  isDebugMode,
  toggleDebugMode,
  networkStatus,
  user,
  currentAssociation,
  lastError,
  handleRetry,
  retryCount,
  loadTime = 0,
  requestInfo,
}) => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="mt-8">
      <DebugModeToggle
        isDebugMode={isDebugMode}
        toggleDebugMode={toggleDebugMode}
      />

      {isDebugMode && (
        <div className="space-y-4">
          <Tabs
            defaultValue="general"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
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
                errorData={lastError}
                onRetry={handleRetry}
                requestInfo={{
                  retryCount,
                  requestTimestamp: requestInfo?.requestTimestamp,
                  responseTimestamp: requestInfo?.responseTimestamp,
                }}
              />
            </TabsContent>

            <TabsContent value="performance">
              <DashboardPerformanceDebug
                isVisible={activeTab === 'performance'}
                networkStatus={networkStatus}
                loadTime={loadTime}
                requestInfo={{
                  retryCount,
                  requestTimestamp: requestInfo?.requestTimestamp,
                  responseTimestamp: requestInfo?.responseTimestamp,
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default DashboardDebugPanel;

'use client';

import React, { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader, Clock, Activity, Database, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { isDebugModeEnabled } from '@/utils/debug';

interface DashboardLoadingProps {
  networkStatus: 'online' | 'offline';
  loadingDuration?: number;
  isDebugMode?: boolean;
  retryCount?: number;
}

/**
 * Loading screen for the dashboard with visual feedback on loading progress
 * Includes debugging information when debug mode is enabled
 */
const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  networkStatus,
  loadingDuration = 0,
  isDebugMode: propIsDebugMode,
  retryCount = 0,
}) => {
  // Initialize once on mount rather than checking localStorage on every render
  const [effectiveDebugMode] = useState(
    () => propIsDebugMode || isDebugModeEnabled(),
  );

  // Determine if loading is slow (more than 3 seconds)
  const isSlowLoading = loadingDuration > 3000;

  // Memoize loading icons to prevent recreation on every render
  const loadingIcons = useMemo(
    () => [
      <Activity
        key="activity"
        className="h-8 w-8 text-primary animate-pulse"
      />,
      <Clock key="clock" className="h-8 w-8 text-primary animate-pulse" />,
      <Database
        key="database"
        className="h-8 w-8 text-primary animate-pulse"
      />,
    ],
    [],
  );

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>

        {effectiveDebugMode && (
          <div className="text-xs bg-muted p-2 rounded border-l-2 border-primary">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex items-center">
                <span className="font-medium mr-2">Network:</span>
                <Badge
                  variant={
                    networkStatus === 'online' ? 'outline' : 'destructive'
                  }
                  className="text-xs"
                >
                  {networkStatus}
                </Badge>
              </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Loading time:</span>
                <Badge
                  variant={isSlowLoading ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {loadingDuration}ms
                </Badge>
              </div>
              {retryCount > 0 && (
                <div className="flex items-center">
                  <span className="font-medium mr-2">Retries:</span>
                  <Badge variant="secondary" className="text-xs">
                    {retryCount}
                  </Badge>
                </div>
              )}
            </div>

            {isSlowLoading && (
              <div className="flex items-center mt-2 text-amber-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Loading is taking longer than expected</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-40 space-y-4">
                {loadingIcons[i - 1]}
                {effectiveDebugMode && (
                  <div className="w-full mt-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Progress
                      value={Math.min(100, loadingDuration / 100)}
                      className="w-full transition-all duration-500 ease-in-out"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center my-8">
        <div className="flex items-center space-x-2">
          <Loader className="h-5 w-5 animate-spin text-primary" />
          <span
            className={`text-sm ${networkStatus === 'offline' ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {networkStatus === 'online'
              ? `Loading dashboard data${loadingDuration > 2000 ? ' (this is taking longer than usual)' : ''}...`
              : 'Network connection issues, retrying...'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardLoading;

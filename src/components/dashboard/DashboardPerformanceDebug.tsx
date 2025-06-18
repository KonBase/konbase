'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, Database, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceMetrics from '@/utils/debug/performance-metrics';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';

interface DashboardPerformanceDebugProps {
  isVisible: boolean;
  networkStatus: {
    status: 'online' | 'offline';
    testConnection: () => Promise<boolean | null>;
    isTestingConnection: boolean;
    lastTestedAt: number | null;
    testResults: {
      success: boolean;
      timestamp: number;
      error?: Error;
    } | null;
  };
  loadTime: number;
  requestInfo?: {
    requestTimestamp?: number | null;
    responseTimestamp?: number | null;
    retryCount?: number;
  };
}

const DashboardPerformanceDebug: React.FC<DashboardPerformanceDebugProps> = ({
  isVisible,
  networkStatus,
  loadTime,
  requestInfo,
}) => {
  const [activeTab, setActiveTab] = useState('metrics');
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null);
  const [hasWarnings, setHasWarnings] = useState(false);

  // Track the last time we tested to prevent frequent retesting
  const lastNetworkTestRef = useRef<number | null>(null);
  const lastSupabaseTestRef = useRef<number | null>(null);
  const testThrottleTime = 30000; // Increase minimum time between auto-tests (30 seconds)
  const testInitiated = useRef(false);

  // Memoize query time calculation to avoid recalculating on every render
  const queryTime = useMemo(() => {
    if (requestInfo?.requestTimestamp && requestInfo?.responseTimestamp) {
      return requestInfo.responseTimestamp - requestInfo.requestTimestamp;
    }
    return null;
  }, [requestInfo?.requestTimestamp, requestInfo?.responseTimestamp]);

  // Check if we should perform test based on throttling
  const shouldPerformTest = (
    lastTestRef: React.MutableRefObject<number | null>,
  ) => {
    // Skip if not in debug mode
    if (!isDebugModeEnabled()) return false;

    const now = Date.now();

    // Allow testing if:
    // 1. We have never tested before (lastTestRef.current is null)
    // 2. It's been longer than throttleTime since last test
    return !lastTestRef.current || now - lastTestRef.current > testThrottleTime;
  };

  const testNetworkLatency = async (manual = false) => {
    // Skip if not a manual test and we shouldn't perform the test due to throttling
    if (!manual && !shouldPerformTest(lastNetworkTestRef)) {
      return null;
    }

    // Skip automatic tests entirely if not in debug mode
    if (!manual && !isDebugModeEnabled()) {
      return null;
    }

    // Skip if already testing to prevent parallel tests
    if (isTesting) return null;

    setIsTesting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const start = performance.now();
      await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const end = performance.now();
      const latency = Math.round(end - start);
      setNetworkLatency(latency);

      // Only log if this is a manual test or debug mode is enabled
      if (manual || isDebugModeEnabled()) {
        logDebug(
          'Network latency test',
          { latency: `${latency}ms`, manual },
          'info',
        );
      }

      if (latency > 500) {
        setHasWarnings(true);
      }

      // Update last test timestamp
      lastNetworkTestRef.current = Date.now();

      return latency;
    } catch (error) {
      if (manual || isDebugModeEnabled()) {
        logDebug('Network latency test failed', error, 'error');
      }
      setHasWarnings(true);
      return null;
    } finally {
      setIsTesting(false);
    }
  };

  const testSupabaseLatency = async (manual = false) => {
    // Skip if not a manual test and we shouldn't perform the test due to throttling
    if (!manual && !shouldPerformTest(lastSupabaseTestRef)) {
      return null;
    }

    // Skip automatic tests entirely if not in debug mode
    if (!manual && !isDebugModeEnabled()) {
      return null;
    }

    // Skip if already testing to prevent parallel tests
    if (isTesting) return null;

    setIsTesting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const start = performance.now();
      await fetch('https://ecvsnnfdaqjnbcpvxlly.supabase.co', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const end = performance.now();
      const latency = Math.round(end - start);
      setSupabaseLatency(latency);

      // Only log if this is a manual test or debug mode is enabled
      if (manual || isDebugModeEnabled()) {
        logDebug(
          'Supabase latency test',
          { latency: `${latency}ms`, manual },
          'info',
        );
      }

      if (latency > 800) {
        setHasWarnings(true);
      }

      // Update last test timestamp
      lastSupabaseTestRef.current = Date.now();

      return latency;
    } catch (error) {
      if (manual || isDebugModeEnabled()) {
        logDebug('Supabase latency test failed', error, 'error');
      }
      setHasWarnings(true);
      return null;
    } finally {
      setIsTesting(false);
    }
  };

  // Only run automatic tests when component becomes visible AND debug mode is enabled,
  // but make sure we only run it once (not on every re-render)
  useEffect(() => {
    if (isVisible && isDebugModeEnabled() && !testInitiated.current) {
      // Set a delay to avoid running tests immediately on initial load
      const timer = setTimeout(() => {
        if (isDebugModeEnabled()) {
          testInitiated.current = true;
          testNetworkLatency(false);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }

    if (!isVisible) {
      // Reset test initiated flag when component is hidden
      testInitiated.current = false;
    }
  }, [isVisible]);

  // Don't render anything if not visible or debug mode is disabled
  if (!isVisible || !isDebugModeEnabled()) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Performance Debug Tools</span>
          {hasWarnings && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs
          defaultValue="metrics"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full mb-2">
            <TabsTrigger value="metrics" className="text-xs">
              Performance Metrics
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs">
              Network Tests
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              API Diagnostics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-2">
            <PerformanceMetrics
              networkLatency={networkLatency}
              loadTime={loadTime}
              queryTime={queryTime}
              isVisible={activeTab === 'metrics'}
            />
          </TabsContent>

          <TabsContent value="network" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background p-2 rounded border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium flex items-center">
                    <Wifi className="h-3 w-3 mr-1" /> External Network
                  </span>
                  <span
                    className={
                      networkLatency && networkLatency > 500
                        ? 'text-red-500'
                        : ''
                    }
                  >
                    {networkLatency ? `${networkLatency}ms` : 'Unknown'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={() => testNetworkLatency(true)} // Set manual=true for manual button clicks
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Test Latency
                </Button>
              </div>

              <div className="bg-background p-2 rounded border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium flex items-center">
                    <Database className="h-3 w-3 mr-1" /> Supabase API
                  </span>
                  <span
                    className={
                      supabaseLatency && supabaseLatency > 800
                        ? 'text-red-500'
                        : ''
                    }
                  >
                    {supabaseLatency ? `${supabaseLatency}ms` : 'Unknown'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={() => testSupabaseLatency(true)} // Set manual=true for manual button clicks
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Test API
                </Button>
              </div>
            </div>

            <div className="text-xs bg-background p-2 rounded border">
              <div className="font-medium mb-1">Connection Status</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Network Status:</span>
                  <span
                    className={
                      networkStatus.status === 'offline'
                        ? 'text-red-500'
                        : 'text-green-500'
                    }
                  >
                    {networkStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Tested:</span>
                  <span>
                    {networkStatus.lastTestedAt
                      ? new Date(
                          networkStatus.lastTestedAt,
                        ).toLocaleTimeString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Test Result:</span>
                  <span
                    className={
                      networkStatus.testResults?.success
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {networkStatus.testResults?.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 h-7 text-xs"
                onClick={() => networkStatus.testConnection()}
                disabled={networkStatus.isTestingConnection}
              >
                {networkStatus.isTestingConnection ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Test Connection
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-2">
            <div className="text-xs bg-background p-2 rounded border overflow-auto max-h-[200px]">
              <div className="font-medium mb-1">API Request Info</div>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    requestStarted: requestInfo?.requestTimestamp
                      ? new Date(requestInfo.requestTimestamp).toISOString()
                      : null,
                    requestCompleted: requestInfo?.responseTimestamp
                      ? new Date(requestInfo.responseTimestamp).toISOString()
                      : null,
                    duration: queryTime ? `${queryTime}ms` : null,
                    retries: requestInfo?.retryCount || 0,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>

            <div className="text-xs bg-muted p-2 rounded">
              <p className="mb-1 font-medium">Troubleshooting Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  High Supabase latency ({`>`}800ms) may indicate database
                  connection issues
                </li>
                <li>
                  API failures with long load times could mean rate limiting
                </li>
                <li>Multiple retries suggest intermittent connectivity</li>
                <li>Check browser console for detailed error logs</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardPerformanceDebug;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Wifi, Database } from 'lucide-react';

interface PerformanceMetricsProps {
  networkLatency?: number | null;
  loadTime?: number;
  queryTime?: number | null;
  isVisible: boolean;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  networkLatency,
  loadTime = 0,
  queryTime,
  isVisible,
}) => {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  // Get performance metrics from browser
  useEffect(() => {
    if (isVisible && window.performance) {
      // Try to get memory info if available
      const memory = (performance as any).memory;
      if (memory) {
        const usedHeapSizeMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMemoryUsage(usedHeapSizeMB);
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getLatencyRating = (latency: number | null | undefined) => {
    if (!latency) return 'unknown';
    if (latency < 200) return 'good';
    if (latency < 500) return 'medium';
    return 'poor';
  };

  const getLoadTimeRating = (time: number) => {
    if (time < 1000) return 'good';
    if (time < 3000) return 'medium';
    return 'poor';
  };

  const networkRating = getLatencyRating(networkLatency);
  const loadRating = getLoadTimeRating(loadTime);

  return (
    <Card className="text-xs">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 py-2">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="flex items-center">
              <Wifi className="h-3 w-3 mr-1" /> Network Latency
            </span>
            <Badge
              variant={
                networkRating === 'good'
                  ? 'default'
                  : networkRating === 'medium'
                    ? 'secondary'
                    : networkRating === 'poor'
                      ? 'destructive'
                      : 'outline'
              }
            >
              {networkLatency ? `${networkLatency}ms` : 'Unknown'}
            </Badge>
          </div>
          {networkLatency && (
            <Progress
              value={Math.min(100, networkLatency / 10)}
              className={`h-1 ${
                networkRating === 'good'
                  ? 'bg-green-200'
                  : networkRating === 'medium'
                    ? 'bg-yellow-200'
                    : 'bg-red-200'
              }`}
            />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" /> Page Load Time
            </span>
            <Badge
              variant={
                loadRating === 'good'
                  ? 'default'
                  : loadRating === 'medium'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {loadTime}ms
            </Badge>
          </div>
          <Progress
            value={Math.min(100, loadTime / 50)}
            className={`h-1 ${
              loadRating === 'good'
                ? 'bg-green-200'
                : loadRating === 'medium'
                  ? 'bg-yellow-200'
                  : 'bg-red-200'
            }`}
          />
        </div>

        {queryTime !== null && queryTime !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="flex items-center">
                <Database className="h-3 w-3 mr-1" /> Query Time
              </span>
              <Badge
                variant={
                  queryTime < 300
                    ? 'default'
                    : queryTime < 1000
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {queryTime}ms
              </Badge>
            </div>
            <Progress
              value={Math.min(100, queryTime / 30)}
              className={`h-1 ${
                queryTime < 300
                  ? 'bg-green-200'
                  : queryTime < 1000
                    ? 'bg-yellow-200'
                    : 'bg-red-200'
              }`}
            />
          </div>
        )}

        {memoryUsage !== null && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Memory Usage (JS Heap)</span>
              <Badge variant="outline">{memoryUsage} MB</Badge>
            </div>
          </div>
        )}

        <div className="text-[10px] text-muted-foreground mt-2 border-t pt-1">
          <span className="flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            High latency could indicate network or API issues
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;

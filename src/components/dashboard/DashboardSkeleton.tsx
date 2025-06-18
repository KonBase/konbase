'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface DashboardSkeletonProps {
  showErrorState?: boolean;
}

export const DashboardCardSkeleton: React.FC<{ error?: boolean }> = ({
  error,
}) => {
  return (
    <Card className={error ? 'border-red-200' : ''}>
      <CardHeader className="pb-2">
        <Skeleton className={`h-6 w-3/4 mb-2 ${error ? 'bg-red-100' : ''}`} />
        <Skeleton className={`h-4 w-1/2 ${error ? 'bg-red-100' : ''}`} />
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center h-20 border border-dashed border-red-200 rounded bg-red-50">
            <AlertCircle className="text-red-400 mr-2 h-4 w-4" />
            <span className="text-sm text-red-500">Error loading content</span>
          </div>
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  showErrorState,
}) => {
  return (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <Skeleton
          className={`h-8 w-48 ${showErrorState ? 'bg-red-100' : ''}`}
        />
        <Skeleton
          className={`h-4 w-64 ${showErrorState ? 'bg-red-100' : ''}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <DashboardCardSkeleton key={i} error={showErrorState} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {showErrorState && (
          <div className="lg:col-span-3 text-center py-4 text-sm text-muted-foreground">
            <p>
              Network connectivity issues may be affecting dashboard loading.
            </p>
            <p>Check your connection and try refreshing the page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

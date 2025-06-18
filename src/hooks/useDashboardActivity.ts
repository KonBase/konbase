import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/debug';
import { useState, useCallback, useRef, useMemo } from 'react';

// Implement a custom hook for fetching dashboard activity data
export const useDashboardActivity = (currentAssociation: any) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<any>(null);
  const [requestTimestamp, setRequestTimestamp] = useState<number | null>(null);
  const [responseTimestamp, setResponseTimestamp] = useState<number | null>(
    null,
  );
  const isFetchingRef = useRef(false);
  const cachedDataRef = useRef<any[]>([]);

  // Query to fetch recent activity data with optimized staleTime and cache settings
  const {
    data: activityData,
    error: activityError,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ['dashboard-activity', currentAssociation?.id],
    queryFn: async () => {
      try {
        // Prevent duplicate fetches
        if (isFetchingRef.current) {
          return cachedDataRef.current;
        }

        // If no association is selected, return empty array immediately
        if (!currentAssociation?.id) {
          return [];
        }

        isFetchingRef.current = true;

        // Log the query start (only in debug mode)
        setRequestTimestamp(Date.now());

        // Fetch recent activity data (last 30 days)
        let query = supabase
          .from('audit_logs')
          .select('*')
          .eq('entity', 'association')
          .eq('entity_id', currentAssociation.id)
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: activityData, error: activityError } = await query;

        setResponseTimestamp(Date.now());

        if (activityError) {
          setLastError(activityError);
          throw activityError;
        }

        // Update our cached reference
        if (activityData) {
          cachedDataRef.current = activityData;
        }

        return activityData || [];
      } catch (error) {
        setResponseTimestamp(Date.now());
        setLastError(error);
        handleError(error, 'useDashboardActivity.fetchActivity');
        throw error;
      } finally {
        isFetchingRef.current = false;
      }
    },
    staleTime: 300000, // 5 minutes - increase stale time to reduce refetches
    refetchOnWindowFocus: false, // Disable automatic refetching on window focus
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch when reconnecting
    enabled: !!currentAssociation?.id,
    retry: 1, // Limit retries to prevent excessive queries
  });

  // Safe getter for activity data with error checking
  const safeRecentActivity = useMemo(() => {
    if (activityError) {
      return [];
    }

    // Check if we have valid data
    if (activityData && Array.isArray(activityData)) {
      return activityData;
    }

    return [];
  }, [activityData, activityError]);

  // Function to handle retry with tracking
  const handleRetry = useCallback(() => {
    // Prevent retry if already fetching
    if (isFetchingRef.current) return;

    setRetryCount((prev) => prev + 1);
    setRequestTimestamp(Date.now());
    setResponseTimestamp(null);
    return refetchActivity();
  }, [refetchActivity]);

  return {
    activityData,
    activityError,
    activityLoading,
    refetchActivity,
    handleRetry,
    retryCount,
    lastError,
    safeRecentActivity,
    isLoadingActivity: activityLoading,
    requestInfo: {
      requestTimestamp,
      responseTimestamp,
      retryCount,
    },
  };
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/debug';
import { useState, useCallback, useRef, useMemo } from 'react';

// Implement a custom hook for fetching dashboard activity data
export const useDashboardActivity = (currentAssociation: any) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<any>(null);
  const [requestTimestamp, setRequestTimestamp] = useState<number | null>(null);
  const [responseTimestamp, setResponseTimestamp] = useState<number | null>(null);
  const isFetchingRef = useRef(false);
  const cachedDataRef = useRef<any[]>([]);

  // Query to fetch recent activity data with optimized staleTime and cache settings
  const { 
    data: activityData, 
    error: activityError, 
    isLoading: activityLoading, 
    refetch: refetchActivity 
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
        
        // Fetch recent activity data from all relevant entities for this association
        // We'll get activities from associations, conventions, items, and modules
        
        // First, get association-level activities
        const { data: associationActivities, error: associationError } = await supabase
          .from('audit_logs')
          .select(`
            *,
            profiles!audit_logs_user_id_fkey(name, email)
          `)
          .eq('entity', 'association')
          .eq('entity_id', currentAssociation.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (associationError) throw associationError;

        // Get convention IDs for this association first
        const { data: conventionIds, error: conventionIdsError } = await supabase
          .from('conventions')
          .select('id')
          .eq('association_id', currentAssociation.id);

        if (conventionIdsError) throw conventionIdsError;

        // Get convention activities for this association
        let conventionActivities: any[] = [];
        if (conventionIds && conventionIds.length > 0) {
          const { data: conventionData, error: conventionError } = await supabase
            .from('audit_logs')
            .select(`
              *,
              profiles!audit_logs_user_id_fkey(name, email)
            `)
            .eq('entity', 'convention')
            .in('entity_id', conventionIds.map(c => c.id))
            .order('created_at', { ascending: false })
            .limit(5);

          if (conventionError) throw conventionError;
          conventionActivities = conventionData || [];
        }

        // Get item IDs for this association first
        const { data: itemIds, error: itemIdsError } = await supabase
          .from('items')
          .select('id')
          .eq('association_id', currentAssociation.id);

        if (itemIdsError) throw itemIdsError;

        // Get item activities for this association
        let itemActivities: any[] = [];
        if (itemIds && itemIds.length > 0) {
          const { data: itemData, error: itemError } = await supabase
            .from('audit_logs')
            .select(`
              *,
              profiles!audit_logs_user_id_fkey(name, email)
            `)
            .eq('entity', 'item')
            .in('entity_id', itemIds.map(i => i.id))
            .order('created_at', { ascending: false })
            .limit(5);

          if (itemError) throw itemError;
          itemActivities = itemData || [];
        }

        // Get module activities for this association (if modules table exists)
        // Skip modules for now since the table doesn't exist in this database
        let moduleActivities: any[] = [];
        
        // TODO: Uncomment this section when modules table is added to the database
        /*
        try {
          // First check if modules table exists by trying to get module IDs
          const { data: moduleIds, error: moduleIdsError } = await supabase
            .from('modules')
            .select('id')
            .eq('association_id', currentAssociation.id);

          // Only proceed if we got data without error
          if (!moduleIdsError && moduleIds && moduleIds.length > 0) {
            const { data: moduleData, error: moduleError } = await supabase
              .from('audit_logs')
              .select(`
                *,
                profiles!audit_logs_user_id_fkey(name, email)
              `)
              .eq('entity', 'module')
              .in('entity_id', moduleIds.map(m => m.id))
              .order('created_at', { ascending: false })
              .limit(5);

            if (!moduleError) {
              moduleActivities = moduleData || [];
            }
          }
        } catch (error) {
          // Modules table might not exist, ignore the error silently
          // This is expected behavior when modules table doesn't exist
        }
        */

        // Combine all activities and sort by created_at
        const allActivities = [
          ...(associationActivities || []),
          ...conventionActivities,
          ...itemActivities,
          ...moduleActivities
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, 20); // Limit to 20 most recent activities

        const activityData = allActivities;
        
        setResponseTimestamp(Date.now());
        
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
    
    setRetryCount(prev => prev + 1);
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
      retryCount
    }
  };
};

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { isDebugModeEnabled } from '@/utils/debug';

interface UseNetworkStatusProps {
  showToasts?: boolean;
  testInterval?: number | null; // Set to null to disable automatic testing
  testEndpoint?: string;
  respectDebugMode?: boolean;
}

const useNetworkStatus = ({
  showToasts = false,
  testInterval = 30000, // 30 seconds default, or null to disable
  testEndpoint = 'https://www.google.com',
  respectDebugMode = true,
}: UseNetworkStatusProps = {}) => {
  // Initialize state with navigator.onLine but don't re-render on every check
  const [status, setStatus] = useState<'online' | 'offline'>(
    navigator.onLine ? 'online' : 'offline',
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastTestedAt, setLastTestedAt] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    timestamp: number;
    error?: Error;
  } | null>(null);

  const intervalTimerRef = useRef<number | null>(null);
  const lastTestTimeRef = useRef<number>(0);
  const statusRef = useRef(status);
  const { toast } = useToast();

  // Update the ref whenever status changes
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Clear any existing interval on unmount or when props change
  const clearTestInterval = useCallback(() => {
    if (intervalTimerRef.current !== null) {
      window.clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
  }, []);

  // Memoize the test connection function to avoid recreating it on every render
  const testConnection = useCallback(async (): Promise<boolean | null> => {
    // Skip the entire function if not in debug mode and respectDebugMode is true
    if (respectDebugMode && !isDebugModeEnabled()) {
      return null;
    }

    // Throttle tests to avoid excessive checks
    const now = Date.now();
    if (now - lastTestTimeRef.current < 2000) {
      // Don't test more than once every 2 seconds
      return null;
    }

    lastTestTimeRef.current = now;

    // Prevent concurrent tests
    if (isTestingConnection) {
      return null;
    }

    setIsTestingConnection(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(testEndpoint, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const success = response.type === 'opaque' || response.ok;
      const timestamp = Date.now();

      setLastTestedAt(timestamp);
      setTestResults({ success, timestamp });

      // Only update status if it's different to avoid unnecessary re-renders
      if (statusRef.current !== 'online' && success) {
        setStatus('online');
        if (showToasts) {
          toast({
            title: 'Connection restored',
            description: 'Your network connection is active again.',
          });
        }
      } else if (statusRef.current === 'online' && !success) {
        setStatus('offline');
        if (showToasts) {
          toast({
            title: 'Connection lost',
            description:
              'You appear to be offline. Some features may be unavailable.',
            variant: 'destructive',
          });
        }
      }

      return success;
    } catch (error) {
      const timestamp = Date.now();
      setLastTestedAt(timestamp);
      setTestResults({
        success: false,
        timestamp,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // Only update status if it's different
      if (statusRef.current === 'online') {
        setStatus('offline');
        if (showToasts) {
          toast({
            title: 'Connection lost',
            description:
              'You appear to be offline. Some features may be unavailable.',
            variant: 'destructive',
          });
        }
      }

      return false;
    } finally {
      setIsTestingConnection(false);
    }
  }, [testEndpoint, showToasts, toast, isTestingConnection, respectDebugMode]);

  // Handle browser's online/offline events
  useEffect(() => {
    const handleOnline = () => {
      // Skip update if status is already online to avoid re-renders
      if (statusRef.current !== 'online') {
        setStatus('online');
        // Only show toast if configured to do so
        if (showToasts) {
          toast({
            title: 'Connection restored',
            description: 'Your network connection is active again.',
          });
        }
      }
    };

    const handleOffline = () => {
      // Skip update if status is already offline to avoid re-renders
      if (statusRef.current !== 'offline') {
        setStatus('offline');
        // Only show toast if configured to do so
        if (showToasts) {
          toast({
            title: 'Connection lost',
            description:
              'You appear to be offline. Some features may be unavailable.',
            variant: 'destructive',
          });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, showToasts]);

  // Setup interval testing
  useEffect(() => {
    clearTestInterval();

    // Skip interval setup completely if:
    // 1. testInterval is null or 0 (interval testing is disabled)
    // 2. respectDebugMode is true AND debug mode is disabled
    if (!testInterval || (respectDebugMode && !isDebugModeEnabled())) {
      return clearTestInterval;
    }

    // Only run a single test at the beginning
    if (isDebugModeEnabled()) {
      const initialTestId = setTimeout(() => {
        testConnection();
      }, 1000);

      // Setup regular interval after initial test
      intervalTimerRef.current = window.setInterval(() => {
        // Extra check to avoid tests if debug mode got disabled
        if (!respectDebugMode || isDebugModeEnabled()) {
          testConnection();
        }
      }, testInterval);

      return () => {
        clearTimeout(initialTestId);
        clearTestInterval();
      };
    }

    return clearTestInterval;
  }, [testInterval, testConnection, clearTestInterval, respectDebugMode]);

  // Memoize return values to prevent unnecessary re-renders of consuming components
  return useMemo(
    () => ({
      status,
      isOnline: status === 'online',
      isOffline: status === 'offline',
      testConnection,
      isTestingConnection,
      lastTestedAt,
      testResults,
    }),
    [status, isTestingConnection, lastTestedAt, testResults, testConnection],
  );
};

export default useNetworkStatus;

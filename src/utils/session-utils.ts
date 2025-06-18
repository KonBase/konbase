import { logDebug, isDebugModeEnabled } from '@/utils/debug';

/**
 * Saves the current path to localStorage for later restoration
 */
export const saveCurrentPath = (path: string): void => {
  try {
    // Don't save login/register/etc paths
    const publicPaths = [
      '/login',
      '/register',
      '/setup',
      '/forgot-password',
      '/reset-password',
    ];
    if (publicPaths.includes(path)) return;

    localStorage.setItem('kb_last_path', path);

    // Only log if debug mode is enabled
    if (isDebugModeEnabled()) {
      logDebug('Saved current path', { path }, 'info');
    }
  } catch (error) {
    console.error('Error saving path to localStorage:', error);
  }
};

/**
 * Retrieves the last visited path from localStorage
 */
export const getLastVisitedPath = (
  defaultPath: string = '/dashboard',
): string => {
  try {
    const savedPath = localStorage.getItem('kb_last_path');
    return savedPath || defaultPath;
  } catch (error) {
    console.error('Error retrieving path from localStorage:', error);
    return defaultPath;
  }
};

/**
 * Saves session data to localStorage for quick recovery
 */
export const saveSessionData = (session: any): void => {
  try {
    if (!session) return;

    // Store minimal session data
    localStorage.setItem(
      'kb_session',
      JSON.stringify({
        timestamp: Date.now(),
        userId: session.user?.id,
      }),
    );

    // Only log if debug mode is enabled
    if (isDebugModeEnabled()) {
      logDebug(
        'Session data saved to localStorage',
        { userId: session.user?.id },
        'info',
      );
    }
  } catch (error) {
    console.error('Error saving session data:', error);
  }
};

/**
 * Gets saved session data
 */
export const getSavedSessionData = (): {
  timestamp: number;
  userId: string;
} | null => {
  try {
    const data = localStorage.getItem('kb_session');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving session data:', error);
    return null;
  }
};

/**
 * Clears saved session data
 */
export const clearSessionData = (): void => {
  try {
    localStorage.removeItem('kb_session');

    // Only log if debug mode is enabled
    if (isDebugModeEnabled()) {
      logDebug('Session data cleared from localStorage', null, 'info');
    }
  } catch (error) {
    console.error('Error clearing session data:', error);
  }
};

/**
 * Adds a route to the navigation history stack
 * This helps avoid refreshing when switching between sections
 */
export const addToNavigationHistory = (path: string): void => {
  try {
    const history = getNavigationHistory();

    // Add current path to history if it's not the same as the last entry
    if (history.length === 0 || history[history.length - 1] !== path) {
      history.push(path);

      // Keep only the last 10 entries to prevent excessive storage
      if (history.length > 10) {
        history.shift();
      }

      localStorage.setItem('kb_nav_history', JSON.stringify(history));

      if (isDebugModeEnabled()) {
        logDebug('Added path to navigation history', { path, history }, 'info');
      }
    }
  } catch (error) {
    console.error('Error adding to navigation history:', error);
  }
};

/**
 * Gets the navigation history stack
 */
export const getNavigationHistory = (): string[] => {
  try {
    const history = localStorage.getItem('kb_nav_history');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving navigation history:', error);
    return [];
  }
};

/**
 * Clears the navigation history
 */
export const clearNavigationHistory = (): void => {
  try {
    localStorage.removeItem('kb_nav_history');

    if (isDebugModeEnabled()) {
      logDebug('Navigation history cleared', null, 'info');
    }
  } catch (error) {
    console.error('Error clearing navigation history:', error);
  }
};

/**
 * Checks if the navigation is between main sections (which might require state reset)
 */
export const isMainSectionChange = (
  previousPath: string,
  currentPath: string,
): boolean => {
  // Get main section from path (first segment after slash)
  const getMainSection = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : '';
  };

  const prevSection = getMainSection(previousPath);
  const currentSection = getMainSection(currentPath);

  return (
    prevSection !== currentSection &&
    prevSection !== '' &&
    currentSection !== ''
  );
};

/**
 * Records the active navigation state to help diagnose issues
 */
export const setNavigationState = (
  state: 'idle' | 'navigating' | 'loading',
): void => {
  try {
    // Store the current navigation state
    localStorage.setItem('kb_nav_state', state);

    // Set a timestamp to track how long we've been in this state
    localStorage.setItem('kb_nav_state_time', Date.now().toString());

    if (isDebugModeEnabled()) {
      logDebug('Navigation state changed', { state }, 'info');
    }
  } catch (error) {
    console.error('Error setting navigation state:', error);
  }
};

/**
 * Unified utility functions for debugging
 * This is the central place for all debugging functionality
 */

/**
 * Storage key used for debug mode preferences
 * Always use this constant to ensure consistency
 */
export const DEBUG_MODE_STORAGE_KEY = 'konbase_debug_mode';
export const DEBUG_LOGS_STORAGE_KEY = 'konbase_debug_logs';

/**
 * Log debug information with optional context data
 *
 * @param message The message to log
 * @param data Optional data to include with the log
 * @param level Log level (info, warn, error)
 */
export const logDebug = (
  message: string,
  data: any = null,
  level: 'info' | 'warn' | 'error' = 'info',
) => {
  // Check if debug mode is enabled explicitly
  const isDebugEnabled = isDebugModeEnabled();

  // Only proceed if debug mode is enabled
  // We no longer check isDev because we want consistent behavior across environments
  if (!isDebugEnabled) return;

  const logObject = {
    timestamp: new Date().toISOString(),
    message,
    data,
    level,
  };

  switch (level) {
    case 'error':
      console.error(`[Konbase Debug] ${message}`, data ? logObject : '');
      break;
    case 'warn':
      console.warn(`[Konbase Debug] ${message}`, data ? logObject : '');
      break;
    case 'info':
    default:
      console.info(`[Konbase Debug] ${message}`, data ? logObject : '');
      break;
  }

  // Store logs in localStorage for the debug panel to display
  // Removed localStorage logging to prevent potential storage of sensitive data
};

/**
 * Utility function for handling and logging errors
 *
 * @param error The error to handle
 * @param source The source of the error (component or function name)
 * @returns A human-readable error message
 */
export const handleError = (error: any, source: string): string => {
  const errorMessage = error?.message || String(error) || 'Unknown error';

  // Always log critical errors to console in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Konbase] Error in ${source}: ${errorMessage}`, error);
  }

  // Only log to debug system if debug mode is enabled
  if (isDebugModeEnabled()) {
    logDebug(`Error in ${source}: ${errorMessage}`, error, 'error');
  }

  return errorMessage;
};

/**
 * Enable or disable debug mode
 * This function updates the localStorage setting and logs the change
 *
 * @param enabled Whether to enable or disable debug mode
 */
export const enableDebugMode = (enabled: boolean = true): void => {
  if (typeof window !== 'undefined') {
    try {
      // Always clear old storage key to avoid confusion
      localStorage.removeItem('konbase-debug-mode');

      // Set the new standardized key
      localStorage.setItem(DEBUG_MODE_STORAGE_KEY, enabled ? 'true' : 'false');

      // Log to console directly (not through logDebug) to ensure it's always shown
      console.info(`[Konbase] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      // Fail silently if localStorage is not available
      console.warn(
        `[Konbase] Unable to ${enabled ? 'enable' : 'disable'} debug mode:`,
        e,
      );
    }
  }
};

/**
 * Check if debug mode is currently enabled
 *
 * @returns boolean indicating if debug mode is enabled
 */
export const isDebugModeEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      // First check the new standardized key
      const isEnabled = localStorage.getItem(DEBUG_MODE_STORAGE_KEY) === 'true';

      // If not found, check the legacy key
      if (localStorage.getItem(DEBUG_MODE_STORAGE_KEY) === null) {
        return localStorage.getItem('konbase-debug-mode') === 'true';
      }

      return isEnabled;
    } catch (_e) {
      // Fail silently if localStorage is not available
      return false;
    }
  }
  return false;
};

/**
 * Clear all debug logs from storage
 */
export const clearDebugLogs = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(DEBUG_LOGS_STORAGE_KEY);

      // Log directly to console instead of using logDebug
      console.info('[Konbase] Debug logs cleared');
    } catch (_e) {
      console.warn('[Konbase] Failed to clear debug logs');
    }
  }
};

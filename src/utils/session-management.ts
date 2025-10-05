import { supabase } from '@/lib/supabase';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';

// Extend Window interface for session monitoring properties
declare global {
  interface Window {
    sessionMonitoringSetup?: boolean;
    sessionRefreshInterval?: NodeJS.Timeout;
  }
}

export interface SessionInfo {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address?: string;
  location?: string;
  is_current: boolean;
  last_active: string;
  created_at: string;
  expires_at: string;
}

export interface SessionSettings {
  session_duration_hours: number;
  max_concurrent_sessions: number;
  require_mfa_for_new_sessions: boolean;
  auto_logout_inactive_minutes: number;
}

/**
 * Get all active sessions for the current user
 */
export const getUserSessions = async (): Promise<SessionInfo[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // For now, we'll simulate session data since Supabase doesn't provide session management out of the box
    // In a real implementation, you'd store this in your database
    const sessions: SessionInfo[] = [
      {
        id: 'current-session',
        user_id: user.id,
        device_name: getDeviceName(),
        device_type: getDeviceType(),
        browser: getBrowserName(),
        os: getOperatingSystem(),
        is_current: true,
        last_active: new Date().toISOString(),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      }
    ];

    if (isDebugModeEnabled()) {
      logDebug('Retrieved user sessions', { count: sessions.length }, 'info');
    }

    return sessions;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
};

/**
 * Sign out a specific session
 */
export const signOutSession = async (sessionId: string): Promise<void> => {
  try {
    if (sessionId === 'current-session') {
      // Sign out current session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      // For other sessions, you'd typically make an API call to your backend
      // to invalidate that specific session
      console.log(`Signing out session: ${sessionId}`);
    }

    if (isDebugModeEnabled()) {
      logDebug('Signed out session', { sessionId }, 'info');
    }
  } catch (error) {
    console.error('Error signing out session:', error);
    throw error;
  }
};

/**
 * Sign out all sessions except current
 */
export const signOutAllOtherSessions = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // In a real implementation, you'd call your backend API to invalidate all sessions
    // except the current one
    console.log('Signing out all other sessions for user:', user.id);

    if (isDebugModeEnabled()) {
      logDebug('Signed out all other sessions', { userId: user.id }, 'info');
    }
  } catch (error) {
    console.error('Error signing out all sessions:', error);
    throw error;
  }
};

/**
 * Update password for the current user
 */
export const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    if (isDebugModeEnabled()) {
      logDebug('Password updated successfully', null, 'info');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Get session settings (admin only)
 */
export const getSessionSettings = async (): Promise<SessionSettings> => {
  try {
    // In a real implementation, you'd fetch this from your database
    const settings: SessionSettings = {
      session_duration_hours: 168, // 7 days
      max_concurrent_sessions: 5,
      require_mfa_for_new_sessions: true,
      auto_logout_inactive_minutes: 30,
    };

    return settings;
  } catch (error) {
    console.error('Error getting session settings:', error);
    throw error;
  }
};

/**
 * Update session settings (admin only)
 */
export const updateSessionSettings = async (settings: Partial<SessionSettings>): Promise<void> => {
  try {
    // In a real implementation, you'd update this in your database
    console.log('Updating session settings:', settings);

    if (isDebugModeEnabled()) {
      logDebug('Session settings updated', settings, 'info');
    }
  } catch (error) {
    console.error('Error updating session settings:', error);
    throw error;
  }
};

/**
 * Check if session is about to expire
 */
export const checkSessionExpiry = async (): Promise<{ expiresIn: number; shouldRefresh: boolean }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { expiresIn: 0, shouldRefresh: false };
    }

    const expiresAt = new Date(session.expires_at! * 1000);
    const now = new Date();
    const expiresIn = expiresAt.getTime() - now.getTime();
    // Refresh if expires in less than 10 minutes (more aggressive)
    const shouldRefresh = expiresIn < 10 * 60 * 1000;

    if (isDebugModeEnabled()) {
      logDebug('Session expiry check', { 
        expiresIn: Math.round(expiresIn / 1000 / 60), // minutes
        shouldRefresh,
        expiresAt: expiresAt.toISOString()
      }, 'info');
    }

    return { expiresIn, shouldRefresh };
  } catch (error) {
    console.error('Error checking session expiry:', error);
    return { expiresIn: 0, shouldRefresh: false };
  }
};

/**
 * Refresh session if needed
 */
export const refreshSessionIfNeeded = async (): Promise<boolean> => {
  try {
    const { expiresIn, shouldRefresh } = await checkSessionExpiry();
    
    if (shouldRefresh) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (isDebugModeEnabled()) {
        logDebug('Session refreshed', { expiresIn }, 'info');
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing session:', error);
    
    // Try to restore from backup if refresh failed
    await restoreSessionFromBackup();
    return false;
  }
};

/**
 * Restore session from backup if available
 */
export const restoreSessionFromBackup = async (): Promise<boolean> => {
  try {
    const backupData = localStorage.getItem('konbase-session-backup');
    if (!backupData) {
      if (isDebugModeEnabled()) {
        logDebug('No session backup found', null, 'info');
      }
      return false;
    }

    const backup = JSON.parse(backupData);
    const now = Date.now();
    const backupAge = now - backup.timestamp;
    
    // Only use backup if it's less than 24 hours old
    if (backupAge > 24 * 60 * 60 * 1000) {
      if (isDebugModeEnabled()) {
        logDebug('Session backup too old, removing', { backupAge }, 'warn');
      }
      localStorage.removeItem('konbase-session-backup');
      return false;
    }

    // Check if backup has required tokens
    if (!backup.access_token || !backup.refresh_token) {
      if (isDebugModeEnabled()) {
        logDebug('Session backup missing required tokens', null, 'warn');
      }
      localStorage.removeItem('konbase-session-backup');
      return false;
    }

    // Try to restore the session
    const { data, error } = await supabase.auth.setSession({
      access_token: backup.access_token,
      refresh_token: backup.refresh_token
    });

    if (error) {
      console.error('Error restoring session from backup:', error);
      localStorage.removeItem('konbase-session-backup');
      return false;
    }

    if (!data.session) {
      if (isDebugModeEnabled()) {
        logDebug('Session restoration returned no session', null, 'warn');
      }
      localStorage.removeItem('konbase-session-backup');
      return false;
    }

    if (isDebugModeEnabled()) {
      logDebug('Session restored from backup', { 
        backupAge, 
        userId: data.session.user?.id,
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString()
      }, 'info');
    }

    return true;
  } catch (error) {
    console.error('Error restoring session from backup:', error);
    localStorage.removeItem('konbase-session-backup');
    return false;
  }
};

// Helper functions for device detection
const getDeviceName = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Mobile')) return 'Mobile Device';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop Computer';
};

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Mobile')) return 'mobile';
  if (userAgent.includes('Tablet')) return 'tablet';
  return 'desktop';
};

const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown Browser';
};

const getOperatingSystem = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown OS';
};

/**
 * Set up session monitoring to prevent unexpected logouts
 */
export const setupSessionMonitoring = (): void => {
  // Prevent multiple setups
  if (window.sessionMonitoringSetup) {
    if (isDebugModeEnabled()) {
      logDebug('Session monitoring already setup, skipping', null, 'info');
    }
    return;
  }
  window.sessionMonitoringSetup = true;

  // Save session state immediately on setup
  const saveCurrentSessionState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('konbase-session-backup', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          timestamp: Date.now()
        }));
        if (isDebugModeEnabled()) {
          logDebug('Session state saved', { userId: session.user?.id }, 'info');
        }
      }
    } catch (error) {
      console.error('Error saving session state:', error);
    }
  };

  // Save session state immediately
  saveCurrentSessionState();

  // Monitor visibility changes to refresh session when tab becomes active
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      if (isDebugModeEnabled()) {
        logDebug('Tab became visible, checking session', null, 'info');
      }
      await refreshSessionIfNeeded();
      // Save session state after refresh
      await saveCurrentSessionState();
    }
  });

  // Monitor focus events
  window.addEventListener('focus', async () => {
    if (isDebugModeEnabled()) {
      logDebug('Window focused, checking session', null, 'info');
    }
    await refreshSessionIfNeeded();
    // Save session state after refresh
    await saveCurrentSessionState();
  });

  // Monitor blur events to save session state
  window.addEventListener('blur', async () => {
    if (isDebugModeEnabled()) {
      logDebug('Window blurred, saving session state', null, 'info');
    }
    // Save current session state when losing focus
    await saveCurrentSessionState();
  });

  // Monitor beforeunload to save session state
  window.addEventListener('beforeunload', async () => {
    await saveCurrentSessionState();
  });

  // Set up periodic session refresh (every 5 minutes for more frequent checks)
  const refreshInterval = setInterval(async () => {
    if (isDebugModeEnabled()) {
      logDebug('Periodic session check', null, 'info');
    }
    await refreshSessionIfNeeded();
    // Save session state after refresh
    await saveCurrentSessionState();
  }, 5 * 60 * 1000); // Every 5 minutes

  // Store interval ID for cleanup
  window.sessionRefreshInterval = refreshInterval;

  // Check session on page load
  setTimeout(async () => {
    if (isDebugModeEnabled()) {
      logDebug('Initial session check on page load', null, 'info');
    }
    await refreshSessionIfNeeded();
    // Save session state after refresh
    await saveCurrentSessionState();
  }, 1000);

  if (isDebugModeEnabled()) {
    logDebug('Session monitoring setup complete', null, 'info');
  }
};

/**
 * Clean up session monitoring
 */
export const cleanupSessionMonitoring = (): void => {
  if (window.sessionRefreshInterval) {
    clearInterval(window.sessionRefreshInterval);
    window.sessionRefreshInterval = null;
  }
  window.sessionMonitoringSetup = false;
  
  if (isDebugModeEnabled()) {
    logDebug('Session monitoring cleaned up', null, 'info');
  }
};

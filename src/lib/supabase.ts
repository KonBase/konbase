import { createClient } from '@supabase/supabase-js';
import { loadConfig } from './config-store';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';

// Store a single instance of the Supabase client
let supabaseClient = null;

// Track realtime connection status
let realtimeConnected = false;
let lastConnectionAttempt = 0;
const connectionRetryDelay = 10000; // 10 seconds between reconnection attempts

// Function to create a client instance - used internally only
const createSupabaseClient = (url, key) => {
  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'konbase-supabase-auth',
        flowType: 'pkce'
      },
      global: {
        // Add global error handler for fetch requests
        fetch: (url, options) => {
          return fetch(url, options)
            .then(response => {
              if (response.status === 404 && url.includes('execute_sql')) {
                // Log specific error for execute_sql RPC endpoint
                if (isDebugModeEnabled()) {
                  logDebug('execute_sql RPC endpoint not found (404)', { url }, 'error');
                }
                // Transform to a proper error object with status code
                return response.json().then(data => {
                  throw { status: 404, message: 'Not Found', details: data };
                });
              }
              return response;
            })
            .catch(error => {
              // Log all fetch errors in debug mode
              if (isDebugModeEnabled()) {
                logDebug('Supabase fetch error', { error, url }, 'error');
              }
              throw error;
            });
        }
      }
    });

    // Set up realtime connection monitoring
    if (client.realtime) {
      setupRealtimeMonitoring(client);
    }

    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

// Monitor realtime connection status
const setupRealtimeMonitoring = (client) => {
  // Only attempt once per period
  const now = Date.now();
  if (now - lastConnectionAttempt < connectionRetryDelay) {
    return;
  }
  
  lastConnectionAttempt = now;
  
  try {
    const channel = client.channel('system-health');
    
    channel
      .on('system', { event: 'disconnect' }, () => {
        realtimeConnected = false;
        if (isDebugModeEnabled()) {
          logDebug('Supabase realtime disconnected', null, 'warn');
        }
        
        // Try to reconnect after a delay
        setTimeout(() => {
          try {
            if (!realtimeConnected) {
              setupRealtimeMonitoring(client);
            }
          } catch (e) {
            // Ignore errors during reconnection attempts
          }
        }, connectionRetryDelay);
      })
      .subscribe((status) => {
        realtimeConnected = status === 'SUBSCRIBED';
        if (isDebugModeEnabled()) {
          logDebug(`Supabase realtime status: ${status}`, null, realtimeConnected ? 'info' : 'warn');
        }
      });
  } catch (error) {
    if (isDebugModeEnabled()) {
      logDebug('Failed to setup realtime monitoring', error, 'error');
    }
  }
};

// Initialize the Supabase client (if not already initialized)
const initClient = () => {
  // If we already have a client, return it
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // First try to get from config store
  const config = loadConfig();
  if (config?.url && config?.key) {
    if (isDebugModeEnabled()) {
      logDebug('Initializing Supabase client from stored config', null, 'info');
    } else {
      console.log('Initializing Supabase client from stored config');
    }
    supabaseClient = createSupabaseClient(config.url, config.key);
    return supabaseClient;
  }
  
  // If no stored config, try environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    if (isDebugModeEnabled()) {
      logDebug('Initializing Supabase client from environment variables', null, 'info');
    } else {
      console.log('Initializing Supabase client from environment variables');
    }
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  }
  
  console.error('No Supabase credentials found for client');
  return null;
};

// A single exported instance for direct import
export const supabase = initClient();

// This function is for when a new instance is needed (like after config changes)
export const initializeSupabaseClient = () => {
  try {
    // Force client re-initialization
    supabaseClient = null;
    realtimeConnected = false;
    return initClient();
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
};

// Get the existing client or initialize if needed
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    return initClient();
  }
  return supabaseClient;
};

// Check if the realtime connection is active
export const isRealtimeConnected = () => {
  return realtimeConnected;
};

// Reconnect realtime if needed
export const reconnectRealtime = () => {
  if (supabaseClient && !realtimeConnected) {
    setupRealtimeMonitoring(supabaseClient);
    return true;
  }
  return false;
};

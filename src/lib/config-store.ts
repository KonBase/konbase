// Configuration storage for application settings
// This file provides utilities for storing and retrieving configuration

export interface SupabaseConfig {
  url: string;
  key: string;
  configured: boolean;
}

const CONFIG_KEY = 'konbase_config';

// Load configuration from localStorage
export function loadConfig(): SupabaseConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const configStr = localStorage.getItem(CONFIG_KEY);
    if (!configStr) return null;

    return JSON.parse(configStr) as SupabaseConfig;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return null;
  }
}

// Save configuration to localStorage
export function saveConfig(config: SupabaseConfig): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save configuration:', error);
    return false;
  }
}

// Check if application is configured via localStorage OR environment variables
export function isConfigured(): boolean {
  // First, check localStorage
  const config = loadConfig();
  if (config?.configured) {
    // Explicitly check if url and key are present in stored config
    if (config.url && config.key) {
      return true;
    }
  }

  // If not configured via localStorage, check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return true if both environment variables are present and non-empty
  return !!(supabaseUrl && supabaseAnonKey);
}

// Clear configuration
export function clearConfig(): boolean {
  try {
    localStorage.removeItem(CONFIG_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear configuration:', error);
    return false;
  }
}

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { loadConfig, isConfigured } from '@/lib/config-store'; // Import loadConfig and isConfigured

let dynamicSupabaseClient: ReturnType<typeof createClient<Database>> | null =
  null;

export const getDynamicSupabaseClient = () => {
  if (dynamicSupabaseClient) {
    return dynamicSupabaseClient;
  }

  const config = loadConfig(); // Use loadConfig
  const configured = isConfigured(); // Use isConfigured

  if (configured && config?.url && config?.key) {
    dynamicSupabaseClient = createClient<Database>(config.url, config.key);
    return dynamicSupabaseClient;
  }

  // console.warn('Dynamic Supabase client could not be initialized. Configuration missing or incomplete.');
  return null;
};

// Optional: Function to reset the client if config changes
export const resetDynamicSupabaseClient = () => {
  dynamicSupabaseClient = null;
};

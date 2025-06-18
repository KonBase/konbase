// This file creates a Supabase client using configuration from localStorage or defaults
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { isConfigured } from '@/lib/config-store';

// Default values - these will be used only if no configuration exists in localStorage
const DEFAULT_SUPABASE_URL = '';
const DEFAULT_SUPABASE_KEY = '';

// Get values from localStorage config if available
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);

// Export a function to check if Supabase is configured
export const isSupabaseConfigured = () =>
  isConfigured() && !!SUPABASE_URL && !!SUPABASE_PUBLISHABLE_KEY;

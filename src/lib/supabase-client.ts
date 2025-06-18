import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log the available authentication methods to help with debugging
console.log('Available Supabase auth methods:', Object.keys(supabase.auth));
console.log(
  'Supabase version compatibility check:',
  typeof supabase.auth.signInWithPassword === 'function' ? 'v2+' : 'unknown',
);

export default supabase;

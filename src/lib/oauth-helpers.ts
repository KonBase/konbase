import { OAuthParams } from '@/types';
import { supabase } from './supabase';
import { logDebug, handleError } from '@/utils/debug';

/**
 * Extracts OAuth parameters from URL hash
 */
export const extractOAuthParams = (hash: string): OAuthParams => {
  if (!hash || hash.length === 0) return {};

  // Remove the leading '#' if present
  const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;

  // Split the hash into key-value pairs
  const pairs = cleanHash.split('&');
  const params: OAuthParams = {};

  pairs.forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[key as keyof OAuthParams] = decodeURIComponent(value);
    }
  });

  return params;
};

/**
 * Processes OAuth redirect and exchanges token for session
 * Stores the session details in localStorage to prevent 404 errors on refresh
 */
export const processOAuthRedirect = async (hash: string) => {
  try {
    const params = extractOAuthParams(hash);

    if (params.access_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token || '',
      });

      if (error) throw error;

      // Store session in localStorage to prevent 404 errors on refresh
      if (data.session) {
        localStorage.setItem(
          'supabase.auth.token',
          JSON.stringify({
            currentSession: data.session,
            expiresAt:
              Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
          }),
        );

        // Also save just the access token in a separate key for cases where only the token is needed
        localStorage.setItem(
          'supabase.auth.access_token',
          data.session.access_token,
        );
      }

      return { success: true, session: data.session };
    }

    return { success: false, error: 'No access token found in URL' };
  } catch (error) {
    handleError(error, 'processOAuthRedirect');
    return { success: false, error };
  }
};

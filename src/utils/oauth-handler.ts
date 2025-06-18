import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';

/**
 * Processes OAuth redirect and exchanges hash parameters for a session
 * @returns {Promise<{ success: boolean, session: any | null, error: any | null }>}
 */
export const handleOAuthRedirect = async () => {
  try {
    // Check if URL contains hash with access token
    if (window.location.hash && window.location.hash.includes('access_token')) {
      logDebug('Processing OAuth redirect', { hash: 'present' }, 'info');

      // Extract hash without the # character
      const hashParams = window.location.hash.substring(1).split('&');
      const params: Record<string, string> = {};

      // Parse hash parameters
      hashParams.forEach((param) => {
        const [key, value] = param.split('=');
        params[key] = decodeURIComponent(value);
      });

      // If we have an access token, exchange it for a session
      if (params.access_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token || '',
        });

        if (error) throw error;

        logDebug(
          'Successfully set session from OAuth redirect',
          { userId: data.user?.id },
          'info',
        );

        // Clear the URL hash to avoid issues on refresh
        window.history.replaceState(null, '', window.location.pathname);

        return { success: true, session: data.session, error: null };
      }
    }

    return {
      success: false,
      session: null,
      error: 'No access token found in URL',
    };
  } catch (error) {
    handleError(error, 'handleOAuthRedirect');
    return { success: false, session: null, error };
  }
};

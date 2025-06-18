import { supabase } from '@/lib/supabase';
import { User, UserRoleType } from '@/types/user';
import { logDebug, handleError } from '@/utils/debug';

/**
 * Fetches the user profile data from Supabase
 * @param userId The user ID to fetch the profile for
 * @returns The user profile data or null if not found
 */
export const fetchUserProfile = async (userId: string) => {
  if (!userId) return null;

  try {
    logDebug('Fetching user profile', { userId }, 'info');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      handleError(error, 'fetchUserProfile');
      return null;
    }

    logDebug(
      'User profile fetched successfully',
      { profileId: data?.id },
      'info',
    );
    return data;
  } catch (error) {
    handleError(error, 'fetchUserProfile');
    return null;
  }
};

/**
 * Enhances a Supabase user with profile data
 * @param user The Supabase user object
 * @param profileData The profile data from the profiles table
 * @returns An enhanced user object
 */
export const enhanceUserWithProfile = (user: User, profileData: any) => {
  if (!user || !profileData) return user;

  logDebug('Enhancing user with profile data', { userId: user.id }, 'info');

  return {
    ...user,
    name:
      profileData.name ||
      user.user_metadata?.name ||
      profileData.email?.split('@')[0] ||
      'User',
    profileImage: profileData.profile_image || user.user_metadata?.avatar_url,
    role: (profileData.role as UserRoleType) || 'guest',
    email: user.email || profileData.email,
  };
};

/**
 * Checks if session is valid and not expired
 * @param session The session object
 * @returns True if the session is valid, false otherwise
 */
export const isSessionValid = (session: any) => {
  if (!session) return false;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at || session.expiresAt;

  const isValid = expiresAt > now;
  logDebug('Checking session validity', { isValid, expiresAt, now }, 'info');

  return isValid;
};

/**
 * Gets the authentication provider information for a user
 * @param user The user object
 * @returns The authentication provider (email, google, discord, etc)
 */
export const getAuthProvider = (user: User | null): string => {
  if (!user) return 'none';

  // Check for identities data from Supabase user object
  if (user.app_metadata?.provider) {
    return user.app_metadata.provider;
  }

  if (user.app_metadata?.providers && user.app_metadata.providers.length > 0) {
    return user.app_metadata.providers[0];
  }

  return 'email';
};

/**
 * Checks if a user authenticated with a social provider
 * @param user The user object
 * @returns True if the user authenticated with a social provider
 */
export const isSocialAuth = (user: User | null): boolean => {
  if (!user) return false;

  const provider = getAuthProvider(user);
  return provider !== 'email' && provider !== 'none';
};

/**
 * Handles Supabase authentication errors with friendly messages
 * @param error The error object from Supabase
 * @returns A user-friendly error message
 */
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  // Extract error message or code
  const errorCode = error.code || '';
  const errorMessage = error.message || 'An unknown error occurred';

  // Map common Supabase error codes to user-friendly messages
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 8 characters.';
    default:
      // Keep the original message for other errors
      return errorMessage;
  }
};

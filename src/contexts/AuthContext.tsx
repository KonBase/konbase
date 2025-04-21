import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // Added useCallback
import { Session, User, AuthError, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { getSupabaseClient, initializeSupabaseClient } from '@/lib/supabase';
import { loadConfig, isConfigured } from '@/lib/config-store'; 
import { UserRoleType, USER_ROLES } from '@/types/user'; // Import UserRoleType and USER_ROLES

// ... (Keep existing type definitions: AuthContextType, UserProfile, etc.) ...
interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  isReady: boolean; 
  isAuthenticated: boolean; // Add isAuthenticated
  signInWithPassword: (credentials: SignInWithPasswordCredentials) => Promise<void>; 
  signInWithOAuth: (provider: 'google' | 'discord') => Promise<void>; 
  signOut: () => Promise<void>;
  reinitializeClient: () => void;
  hasRole: (role: UserRoleType) => boolean; // Add hasRole
}

interface UserProfile {
  // Define structure based on your 'profiles' table
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role?: UserRoleType; // Use UserRoleType
  two_factor_enabled?: boolean; // Add two_factor_enabled
  // Add other profile fields as needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState(() => getSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false); 

  // --- hasRole Implementation ---
  const hasRole = useCallback((requiredRole: UserRoleType): boolean => {
    if (!userProfile || !userProfile.role) {
      return false;
    }
    const currentUserRole = userProfile.role;
    const currentUserLevel = USER_ROLES[currentUserRole]?.level ?? 0;
    const requiredLevel = USER_ROLES[requiredRole]?.level ?? 0;
    
    // Check if the user's role level is greater than or equal to the required level
    return currentUserLevel >= requiredLevel;
  }, [userProfile]);
  // --- End hasRole Implementation ---

  const fetchUserProfile = async (userId: string) => {
    if (!supabaseClient) return; 
    try {
      // Ensure two_factor_enabled is selected
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*, two_factor_enabled') // Explicitly select two_factor_enabled
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data as UserProfile);
    } catch (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      setUserProfile(null); 
    }
  };

  useEffect(() => {
    // Check if the app is configured first
    if (!isConfigured()) {
      setLoading(false);
      setIsReady(false); // Mark auth as not ready if not configured
      setSupabaseClient(null); // Ensure client is null if not configured
      return; // Don't proceed with auth checks
    }

    // If configured, ensure the client is initialized
    let client = supabaseClient;
    if (!client) {
      client = initializeSupabaseClient();
      setSupabaseClient(client);
    }

    // Only run auth checks if the client is initialized
    if (!client) {
      setLoading(false); 
      setIsReady(false); // Still not ready if client failed to initialize
      return;
    }

    setLoading(true);
    // Check initial session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
      setIsReady(true); // Mark as ready after initial check
    }).catch(err => {
        console.error("Error getting session:", err);
        setError(err as AuthError);
        setLoading(false);
        setIsReady(true); // Mark as ready even if session check fails, allows login attempts
    });

    // Set up auth state listener
    const { data: authListener } = client.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchUserProfile(currentUser.id);
        } else {
          setUserProfile(null); // Clear profile on logout
        }
        setLoading(false); // Update loading state on change
        setIsReady(true); // Ensure ready state is true after changes
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
    // Re-run effect if isConfigured() changes (e.g., after setup completes)
    // or if the client instance changes via reinitializeClient
  }, [supabaseClient]); 

  // ... signInWithPassword remains the same ...
  const signInWithPassword = async (credentials: SignInWithPasswordCredentials) => {
    if (!supabaseClient) {
      setError({ name: 'ConfigError', message: 'Supabase not configured.' } as AuthError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Pass credentials directly
      const { error } = await supabaseClient.auth.signInWithPassword(credentials);
      if (error) throw error;
      // Session update will be handled by onAuthStateChange
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  // Add signInWithOAuth function
  const signInWithOAuth = async (provider: 'google' | 'discord') => {
    if (!supabaseClient) {
      setError({ name: 'ConfigError', message: 'Supabase not configured.' } as AuthError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          // Optional: Add redirect URL or scopes if needed
          // redirectTo: window.location.origin + '/auth/callback',
        },
      });
      if (error) throw error;
      // Redirect is handled by Supabase
    } catch (err) {
      console.error(`OAuth sign in error (${provider}):`, err);
      setError(err as AuthError);
      // Ensure loading is stopped even on error before redirect might happen
      setLoading(false); 
    } 
    // No finally setLoading(false) here, as successful OAuth redirects away
  };

  // ... signOut remains the same ...
  const signOut = async () => {
    if (!supabaseClient) {
        setError({ name: 'ConfigError', message: 'Supabase not configured.' } as AuthError);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      // State updates (session, user, profile) handled by onAuthStateChange
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  // reinitializeClient function: Now also resets isReady
  const reinitializeClient = () => {
    setIsReady(false); // Mark as not ready during reinitialization
    setLoading(true);
    const client = initializeSupabaseClient();
    setSupabaseClient(client); // Update state, triggering useEffect
  };

  // --- isAuthenticated derived state ---
  const isAuthenticated = !!session; 
  // --- End isAuthenticated ---

  const value = {
    session,
    user,
    userProfile,
    loading,
    error,
    isReady, 
    isAuthenticated, // Provide isAuthenticated
    signInWithPassword,
    signInWithOAuth, 
    signOut,
    reinitializeClient,
    hasRole, // Provide hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

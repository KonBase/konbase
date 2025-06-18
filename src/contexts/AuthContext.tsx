'use client';

import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  User,
  Session,
  AuthError,
  SignInWithPasswordCredentials,
} from '@supabase/supabase-js';
import { getSupabaseClient, initializeSupabaseClient } from '@/lib/supabase';
import { isConfigured } from '@/lib/config-store';
import { UserRoleType, USER_ROLES } from '@/types/user'; // Import UserRoleType and USER_ROLES
import { AuthContext } from './AuthContextDefinition'; // Import AuthContext from the definition file
import { ErrorType } from '@/types/common';

export interface UserProfile {
  // Define structure based on your 'profiles' table
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role?: UserRoleType; // Use UserRoleType
  two_factor_enabled?: boolean; // Add two_factor_enabled
  // Add other profile fields as needed
}

interface ElevateToSuperAdminResult {
  success: boolean;
  message: string;
}

interface AuthContextProviderValue extends AuthContextType {
  elevateToSuperAdmin: () => Promise<ElevateToSuperAdminResult>;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  hasPermission: (requiredRole: UserRoleType) => boolean;
  checkRoleAccess: (role: UserRoleType) => Promise<boolean>;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  userProfile: UserProfile | null;
  error: AuthError | null;
  isReady: boolean;
  isAuthenticated: boolean;
  signInWithPassword: (
    credentials: SignInWithPasswordCredentials,
  ) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'discord') => Promise<void>;
  signOut: () => Promise<void>;
  reinitializeClient: () => void;
  hasRole: (requiredRole: UserRoleType) => boolean;
}

// Removed the createContext line, as it's now in AuthContextDefinition

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState(() =>
    getSupabaseClient(),
  );
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  // --- hasRole Implementation ---
  const hasRole = useCallback(
    (requiredRole: UserRoleType): boolean => {
      if (!userProfile || !userProfile.role) {
        return false;
      }
      const currentUserRole = userProfile.role;
      const currentUserLevel = USER_ROLES[currentUserRole]?.level ?? 0;
      const requiredLevel = USER_ROLES[requiredRole]?.level ?? 0;

      // Check if the user's role level is greater than or equal to the required level
      return currentUserLevel >= requiredLevel;
    },
    [userProfile],
  );
  // --- End hasRole Implementation ---

  const fetchUserProfile = useCallback(
    async (userId?: string) => {
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
    },
    [supabaseClient],
  );

  useEffect(() => {
    if (!supabaseClient) return;

    const handleAuthStateChange = async () => {
      const {
        data: { user: currentUser },
      } = await supabaseClient.auth.getUser();

      if (currentUser && !userProfile) {
        await fetchUserProfile(currentUser.id);
      } else if (!currentUser) {
        setUser(null);
        setUserProfile(null);
      }
    };

    handleAuthStateChange();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, userProfile, supabaseClient]);

  // ... signInWithPassword remains the same ...
  const signInWithPassword = async (
    credentials: SignInWithPasswordCredentials,
  ) => {
    if (!supabaseClient) {
      setError({
        name: 'ConfigError',
        message: 'Supabase not configured.',
      } as AuthError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Pass credentials directly
      const { error } =
        await supabaseClient.auth.signInWithPassword(credentials);
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
      setError({
        name: 'ConfigError',
        message: 'Supabase not configured.',
      } as AuthError);
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
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error signing out:', err);
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

  // Add login wrapper that matches AuthContextType interface
  const login = async (email: string, password: string) => {
    await signInWithPassword({ email, password });
  };

  // Add logout wrapper that matches AuthContextType interface
  const logout = async () => {
    await signOut();
  };

  const value = {
    session,
    user: user ? { ...user, email: user.email || '' } : null,
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
    login, // Add login method
    logout, // Add logout method
    register: async (email: string, password: string) => {
      // Add register method implementation
      if (!supabaseClient) {
        throw new Error('Supabase not configured');
      }
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
    },
    updateProfile: async (updates: any) => {
      // Add updateProfile method implementation
      if (!supabaseClient || !user) {
        throw new Error('No authenticated user');
      }
      const { error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      await fetchUserProfile(user.id);
    },
    resetPassword: async (email: string) => {
      // Add resetPassword method implementation
      if (!supabaseClient) {
        throw new Error('Supabase not configured');
      }
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },
    updatePassword: async (newPassword: string) => {
      // Add updatePassword method implementation
      if (!supabaseClient) {
        throw new Error('Supabase not configured');
      }
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
  };

  return (
    <AuthContext.Provider 
      value={{
        ...value,
            await fetchUserProfile(user.id);
            return { success: true, message: 'Successfully elevated to Super Admin' };
          } catch (err) {
            const error = err as Error;
            return { success: false, message: error.message };
          }
        },
              hasPermission: (requiredRole: UserRoleType) => boolean;
              checkRoleAccess: (role: UserRoleType) => Promise<boolean>;
            }

                        if (!supabaseClient || !user) {
            throw new Error('No authenticated user');
          }
          const { error } = await supabaseClient
            .from('profiles')
            .update({ role: 'SUPER_ADMIN' })
            .eq('id', user.id);
          if (error) throw error;
          await fetchUserProfile(user.id);
        },
        isLoading: loading,
        ...value,
        signIn: (email: string, password: string) => signInWithPassword({ email, password }),
        signUp: value.register,
        hasPermission: hasRole,
        checkRoleAccess: async (role: UserRoleType) => hasRole(role),
        // Add any other missing properties required by AuthContextType
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

'use client';

import React, { createContext, useEffect, useState } from 'react';
import {
  AuthContextType,
  AuthState,
  AuthUser,
  AuthUserProfile,
} from './AuthTypes';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { USER_ROLES, UserRoleType } from '@/types/user';
import { handleOAuthRedirect } from '@/utils/oauth-redirect-handler';
import { saveSessionData, clearSessionData } from '@/utils/session-utils';
import { useRouter } from '@/lib/navigation';

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // State for the auth context
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    userProfile: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Get user session and set up auth subscription
  useEffect(() => {
    const setupAuth = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        // Handle OAuth redirects if applicable
        const redirectResult = await handleOAuthRedirect();
        if (redirectResult.success && redirectResult.session) {
          await updateUserState(redirectResult.session);
          return;
        }

        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await updateUserState(session);
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            loading: false,
            isAuthenticated: false,
          }));
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              await updateUserState(session);
            }
          } else if (event === 'SIGNED_OUT') {
            setState({
              session: null,
              user: null,
              userProfile: null,
              loading: false,
              error: null,
              isAuthenticated: false,
              isLoading: false,
            });
            clearSessionData();
          }
        });

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
      } catch (error: any) {
        console.error('Error setting up auth:', error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
          isLoading: false,
        }));
      }
    };

    setupAuth();
  }, []);

  // Fetch user profile and update state
  const updateUserState = async (session: Session) => {
    try {
      // Basic user info from session
      const supabaseUser = session.user;

      // Fetch user profile from the database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) throw error;

      // Ensure the role is a valid UserRoleType or default to 'guest'
      const userRole = (profile?.role as UserRoleType) || 'guest';

      // Create extended user object with profile data
      const user: AuthUser = {
        ...supabaseUser,
        name: profile?.name || '',
        profileImage: profile?.profile_image || '',
        role: userRole,
        email: profile?.email || supabaseUser.email || '',
      };

      // Save session data for recovery
      saveSessionData(session);

      // Update all state at once
      setState({
        session,
        user,
        userProfile: profile as AuthUserProfile,
        loading: false,
        error: null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check email verification
      if (!data.user?.email_confirmed_at) {
        // Handle unverified email
        const verificationError = new Error(
          'Please verify your email before logging in.',
        );
        verificationError.name = 'EmailVerificationError';

        // Sign the user out
        await supabase.auth.signOut();

        throw verificationError;
      }

      // Ensure we update the user state immediately after login
      if (data.session) {
        await updateUserState(data.session);
      }

      router.push('/dashboard');

      return data;
    } catch (error: any) {
      console.error('Error signing in:', error);
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Account created',
        description: 'Please check your email to confirm your account.',
      });

      // Redirect or update state as needed
    } catch (error: any) {
      console.error('Error signing up:', error);
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear saved session data
      clearSessionData();

      router.push('/login');

      // Auth state change listener will handle state updates
    } catch (error: any) {
      console.error('Error signing out:', error);
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Check if user has required role
  const hasRole = (requiredRole: UserRoleType): boolean => {
    // If no user, return false
    if (!state.user || !state.user.role) return false;

    // Get the role levels for comparison
    const userRoleLevel =
      USER_ROLES[state.user.role as UserRoleType]?.level || 0;
    const requiredRoleLevel = USER_ROLES[requiredRole]?.level || 0;

    // User's role level must be >= required role level
    return userRoleLevel >= requiredRoleLevel;
  };

  // Check if user has permission
  const hasPermission = (permission: string): boolean => {
    // If no user, return false
    if (!state.user || !state.user.role) return false;

    // Get the role definition
    const role = USER_ROLES[state.user.role as UserRoleType];
    if (!role) return false;

    // Check if the role has the permission
    return (
      role.permissions.includes(permission) ||
      role.permissions.includes('admin:all')
    );
  };

  // Check role access with server validation
  const checkRoleAccess = async (role: UserRoleType): Promise<boolean> => {
    if (!state.session) return false;

    try {
      // Here you'd typically make a server request to validate role
      // For now, we'll use the client-side check
      return hasRole(role);
    } catch (error) {
      console.error('Error checking role access:', error);
      return false;
    }
  };

  // Function to elevate user to super admin (for testing)
  const elevateToSuperAdmin = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!state.isAuthenticated || !state.user) {
      return {
        success: false,
        message: 'You must be logged in to perform this action',
      };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', state.user.id);

      if (error) throw error;

      // Re-fetch user profile to update role
      if (state.session) {
        await updateUserState(state.session);
      }

      toast({
        title: 'Success',
        description: 'User role elevated to Super Admin.',
      });
      return { success: true, message: 'User role elevated to Super Admin.' };
    } catch (error: any) {
      console.error('Error elevating to super admin:', error);
      toast({
        title: 'Error',
        description: `Failed to elevate to Super Admin: ${error.message}`,
        variant: 'destructive',
      });
      return {
        success: false,
        message: `Failed to elevate to Super Admin: ${error.message}`,
      };
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<AuthUserProfile & { avatarFile?: File | null }>) => {
    if (!state.user || !state.session) {
      throw new Error('User not authenticated');
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      let avatarUrl: string | undefined = undefined;
      const profileUpdates: Partial<AuthUserProfile> = { ...updates };
      delete profileUpdates.avatarFile; // Remove avatarFile from profileUpdates

      if (updates.avatarFile && state.user) {
        const file = updates.avatarFile;
        const fileName = `${state.user.id}/${Date.now()}_${file.name}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars') // Ensure 'avatars' bucket exists and has correct policies
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          throw new Error(`Failed to upload avatar: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error('Failed to get public URL for avatar.');
        }
        avatarUrl = publicUrlData.publicUrl;
        profileUpdates.profile_image = avatarUrl;
      }

      // Only proceed with database update if there are actual changes
      if (Object.keys(profileUpdates).length === 0 && !avatarUrl) {
        setState((prev) => ({ ...prev, loading: false }));
        toast({
          title: 'No Changes',
          description: 'No information was changed.',
        });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates) // Use the filtered profileUpdates
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Create extended user object with updated profile data
        const updatedUser: AuthUser = {
          ...(state.user as AuthUser),
          name: data.name || state.user.name,
          profileImage: data.profile_image || state.user.profileImage,
          role: (data.role as UserRoleType) || state.user.role,
          email: data.email || state.user.email,
        };

        setState((prev) => ({
          ...prev,
          user: updatedUser,
          userProfile: data as AuthUserProfile,
          loading: false,
        }));
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        throw new Error('Failed to retrieve updated profile data.');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update profile.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth: async (provider: 'google' | 'discord') => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error(`Error with ${provider} OAuth:`, error);
        toast({
          title: 'OAuth Error',
          description: `Failed to sign in with ${provider}. ${error.message}`,
          variant: 'destructive',
        });
      }
    },
    hasRole,
    hasPermission,
    checkRoleAccess,
    login: signIn, // Alias for signIn
    logout: signOut, // Alias for signOut
    resetPassword: async (email: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: 'Password Reset Email Sent',
          description:
            'If an account exists for this email, a password reset link has been sent.',
        });
      } catch (error: any) {
        console.error('Error sending password reset email:', error);
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
        toast({
          title: 'Password Reset Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
    elevateToSuperAdmin,
    updateProfile, // Add updateProfile to context
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

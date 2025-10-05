import React, { createContext, useEffect, useState } from 'react';
import { AuthContextType, AuthState, AuthUser, AuthUserProfile } from './AuthTypes';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { USER_ROLES, UserRoleType } from '@/types/user';
import { handleOAuthRedirect } from '@/utils/oauth-redirect-handler';
import { setupSessionMonitoring, restoreSessionFromBackup } from '@/utils/session-management';
import { saveSessionData, clearSessionData } from '@/utils/session-utils';

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Handle OAuth redirects if applicable
        const redirectResult = await handleOAuthRedirect();
        if (redirectResult.success && redirectResult.session) {
          await updateUserState(redirectResult.session);
          setupSessionMonitoring();
          return;
        }
        
        // Get initial session - this should work with persisted sessions
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          // Try to restore from backup if session retrieval failed
          const restored = await restoreSessionFromBackup();
          if (restored) {
            const { data: { session: restoredSession } } = await supabase.auth.getSession();
            if (restoredSession?.user) {
              await updateUserState(restoredSession);
              setupSessionMonitoring();
              return;
            }
          }
        }
        
        if (session?.user) {
          await updateUserState(session);
          setupSessionMonitoring();
        } else {
          // Try to restore session from backup if no session found
          const restored = await restoreSessionFromBackup();
          if (restored) {
            // Get the restored session
            const { data: { session: restoredSession } } = await supabase.auth.getSession();
            if (restoredSession?.user) {
              await updateUserState(restoredSession);
              setupSessionMonitoring();
            } else {
              setState(prev => ({
                ...prev, 
                isLoading: false, 
                loading: false, 
                isAuthenticated: false
              }));
            }
          } else {
            setState(prev => ({
              ...prev, 
              isLoading: false, 
              loading: false, 
              isAuthenticated: false
            }));
          }
        }
        
        // Listen for auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (_, session) => {
            if (session?.user) {
              await updateUserState(session);
              // Set up session monitoring after successful login
              setupSessionMonitoring();
            } else {
              setState({
                session: null,
                user: null,
                userProfile: null,
                loading: false,
                error: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        );
        
        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
      } catch (error: any) {
        console.error("Error setting up auth:", error);
        setState(prev => ({
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
        
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      // Ensure the role is a valid UserRoleType or default to 'guest'
      const userRole = profile?.role as UserRoleType || 'guest';
      
      // Create extended user object with profile data
      const user: AuthUser = {
        ...supabaseUser,
        name: profile?.name || "",
        profileImage: profile?.profile_image || "",
        role: userRole,
        email: profile?.email || supabaseUser.email || "",
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
      console.error("Error getting user profile:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Check email verification
      if (!data.user?.email_confirmed_at) {
        // Handle unverified email
        const verificationError = new Error("Please verify your email before logging in.");
        verificationError.name = "EmailVerificationError";
        
        // Sign the user out
        await supabase.auth.signOut();
        
        throw verificationError;
      }
      
      // Ensure we update the user state immediately after login
      if (data.session) {
        await updateUserState(data.session);
      }
      
      return data;
    } catch (error: any) {
      console.error("Error signing in:", error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
      
      // Redirect or update state as needed
    } catch (error: any) {
      console.error("Error signing up:", error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Check if user is super_admin and demote them before logout
      if (state.user?.role === 'super_admin' && state.session?.access_token) {
        try {
          console.log('Demoting super admin before logout');
          await supabase.functions.invoke('demote-from-super-admin', {
            headers: {
              Authorization: `Bearer ${state.session.access_token}`,
            },
          });
          console.log('Successfully demoted from super admin before logout');
        } catch (demotionError) {
          console.error('Error demoting from super admin during logout:', demotionError);
          // Don't throw here, as we still want to proceed with logout
        }
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear saved session data
      clearSessionData();
      
      // Auth state change listener will handle state updates
    } catch (error: any) {
      console.error("Error signing out:", error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Check if user has required role
  const hasRole = (requiredRole: UserRoleType): boolean => {
    // If no user, return false
    if (!state.user || !state.user.role) return false;
    
    // Get the role levels for comparison
    const userRoleLevel = USER_ROLES[state.user.role as UserRoleType]?.level || 0;
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
    return role.permissions.includes(permission) || role.permissions.includes('admin:all');
  };

  // Check role access with server validation
  const checkRoleAccess = async (role: UserRoleType): Promise<boolean> => {
    if (!state.session) return false;
    
    try {
      // Here you'd typically make a server request to validate role
      // For now, we'll use the client-side check
      return hasRole(role);
    } catch (error) {
      console.error("Error checking role access:", error);
      return false;
    }
  };

  // Function to elevate user to super admin (for testing)
  const elevateToSuperAdmin = async (): Promise<{success: boolean, message: string}> => {
    if (!state.isAuthenticated || !state.user) {
      return { success: false, message: 'You must be logged in to perform this action' };
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', state.user.id);
      
      if (error) throw error;
      
      // Update local state
      setState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          role: 'super_admin' as UserRoleType
        } : null,
        userProfile: prev.userProfile ? {
          ...prev.userProfile,
          role: 'super_admin' as UserRoleType
        } : null
      }));
      
      return { success: true, message: 'You are now a super admin' };
    } catch (error: any) {
      console.error("Error elevating to super admin:", error);
      return { success: false, message: error.message };
    }
  };

  // Function to send password reset email
  const resetPassword = async (email: string): Promise<{success: boolean, message: string}> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      return { success: false, message: error.message || 'Failed to send password reset email' };
    }
  };

  // Function to handle OAuth sign-in (Google, Discord, etc.)
  const signInWithOAuth = async (provider: 'google' | 'discord') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      
      if (error) throw error;
      
      // The redirect will happen automatically, no need to do anything else here
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: `${provider} sign in failed`,
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Legacy/convenience methods
  const login = signIn;
  const logout = signOut;

  // Prepare the context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    hasPermission,
    hasRole,
    checkRoleAccess,
    login,
    logout,
    elevateToSuperAdmin,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

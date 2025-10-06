import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';

interface ReauthOptions {
  actionName?: string;
  requirePassword?: boolean;
  requireMFA?: boolean;
  timeout?: number; // in minutes
}

interface ReauthState {
  isRequired: boolean;
  isVerifying: boolean;
  lastVerified: Date | null;
  pendingAction: (() => void) | null;
}

export const useReauth = () => {
  const [reauthState, setReauthState] = useState<ReauthState>({
    isRequired: false,
    isVerifying: false,
    lastVerified: null,
    pendingAction: null,
  });
  
  const { toast } = useToast();

  const checkReauthRequired = useCallback((
    options: ReauthOptions = {}
  ): boolean => {
    const {
      requirePassword = true,
      requireMFA = false,
      timeout = 15, // 15 minutes default
    } = options;

    // If we have a recent verification and don't require MFA, allow the action
    if (reauthState.lastVerified && !requireMFA) {
      const timeSinceVerification = Date.now() - reauthState.lastVerified.getTime();
      const timeoutMs = timeout * 60 * 1000; // Convert to milliseconds
      
      if (timeSinceVerification < timeoutMs) {
        logDebug('Re-authentication not required - recent verification', {
          timeSinceVerification: timeSinceVerification / 1000 / 60,
          timeout
        }, 'info');
        return false;
      }
    }

    // Check if user has MFA enabled when required
    if (requireMFA) {
      // This would need to be implemented based on your MFA setup
      // For now, we'll assume MFA is always required for sensitive operations
      logDebug('Re-authentication required - MFA needed', options, 'info');
      return true;
    }

    // Always require re-auth for password-protected actions
    if (requirePassword) {
      logDebug('Re-authentication required - password needed', options, 'info');
      return true;
    }

    return false;
  }, [reauthState.lastVerified]);

  const requireReauth = useCallback((
    pendingAction: () => void,
    options: ReauthOptions = {}
  ) => {
    const actionName = options.actionName || 'this action';
    
    setReauthState(prev => ({
      ...prev,
      isRequired: true,
      pendingAction,
    }));

    logDebug('Re-authentication required', { actionName, options }, 'info');
    
    toast({
      title: "Security verification required",
      description: `Please verify your identity to ${actionName}.`,
      variant: "default",
    });
  }, [toast]);

  const verifyReauth = useCallback(async (
    password: string,
    mfaCode?: string
  ): Promise<boolean> => {
    setReauthState(prev => ({ ...prev, isVerifying: true }));

    try {
      logDebug('Starting re-authentication verification', null, 'info');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not found');
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        throw new Error('Invalid password');
      }

      // If MFA is required, verify the MFA code
      if (mfaCode) {
        // This would need to be implemented based on your MFA setup
        // For now, we'll just log that MFA verification is needed
        logDebug('MFA verification needed', { mfaCode }, 'info');
        
        // In a real implementation, you would:
        // 1. Get the user's MFA factors
        // 2. Challenge the appropriate factor
        // 3. Verify the MFA code
        // For now, we'll assume MFA verification passes
      }

      // Re-authentication successful
      setReauthState({
        isRequired: false,
        isVerifying: false,
        lastVerified: new Date(),
        pendingAction: null,
      });

      logDebug('Re-authentication successful', null, 'info');

      toast({
        title: "Identity verified",
        description: "You can now proceed with your action.",
      });

      return true;
    } catch (error: any) {
      handleError(error, 'useReauth.verifyReauth');
      
      setReauthState(prev => ({
        ...prev,
        isVerifying: false,
      }));

      let errorMessage = "Verification failed. Please try again.";
      
      if (error.message?.includes('password')) {
        errorMessage = "Invalid password. Please try again.";
      } else if (error.message?.includes('MFA')) {
        errorMessage = "Invalid MFA code. Please try again.";
      }

      toast({
        variant: "destructive",
        title: "Verification failed",
        description: errorMessage,
      });

      return false;
    }
  }, [toast]);

  const cancelReauth = useCallback(() => {
    setReauthState({
      isRequired: false,
      isVerifying: false,
      lastVerified: reauthState.lastVerified,
      pendingAction: null,
    });

    logDebug('Re-authentication cancelled', null, 'info');
  }, [reauthState.lastVerified]);

  const executePendingAction = useCallback(() => {
    if (reauthState.pendingAction) {
      logDebug('Executing pending action after re-authentication', null, 'info');
      reauthState.pendingAction();
    }
  }, [reauthState.pendingAction]);

  const resetReauth = useCallback(() => {
    setReauthState({
      isRequired: false,
      isVerifying: false,
      lastVerified: null,
      pendingAction: null,
    });

    logDebug('Re-authentication state reset', null, 'info');
  }, []);

  return {
    reauthState,
    checkReauthRequired,
    requireReauth,
    verifyReauth,
    cancelReauth,
    executePendingAction,
    resetReauth,
  };
};

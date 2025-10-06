import React, { createContext, useContext, ReactNode } from 'react';
import { useReauth } from '@/hooks/useReauth';
import ReauthDialog from '@/components/auth/ReauthDialog';

interface ReauthContextType {
  reauthState: ReturnType<typeof useReauth>['reauthState'];
  checkReauthRequired: ReturnType<typeof useReauth>['checkReauthRequired'];
  requireReauth: ReturnType<typeof useReauth>['requireReauth'];
  verifyReauth: ReturnType<typeof useReauth>['verifyReauth'];
  cancelReauth: ReturnType<typeof useReauth>['cancelReauth'];
  executePendingAction: ReturnType<typeof useReauth>['executePendingAction'];
  resetReauth: ReturnType<typeof useReauth>['resetReauth'];
}

const ReauthContext = createContext<ReauthContextType | undefined>(undefined);

interface ReauthProviderProps {
  children: ReactNode;
}

export const ReauthProvider: React.FC<ReauthProviderProps> = ({ children }) => {
  const {
    reauthState,
    checkReauthRequired,
    requireReauth,
    verifyReauth,
    cancelReauth,
    executePendingAction,
    resetReauth,
  } = useReauth();

  const handleVerify = async (password: string, mfaCode?: string) => {
    const success = await verifyReauth(password, mfaCode);
    
    if (success) {
      // Execute the pending action after successful verification
      setTimeout(() => {
        executePendingAction();
      }, 500); // Small delay to show success message
    }
    
    return success;
  };

  const value = {
    reauthState,
    checkReauthRequired,
    requireReauth,
    verifyReauth,
    cancelReauth,
    executePendingAction,
    resetReauth,
  };

  return (
    <ReauthContext.Provider value={value}>
      {children}
      
      <ReauthDialog
        isOpen={reauthState.isRequired}
        onClose={cancelReauth}
        onVerify={handleVerify}
        actionName="continue"
        isVerifying={reauthState.isVerifying}
      />
    </ReauthContext.Provider>
  );
};

export const useReauthContext = () => {
  const context = useContext(ReauthContext);
  if (context === undefined) {
    throw new Error('useReauthContext must be used within a ReauthProvider');
  }
  return context;
};

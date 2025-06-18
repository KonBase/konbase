'use client';

import React, { ReactNode, createContext, useContext } from 'react';
import useNetworkStatus from '@/hooks/useNetworkStatus';

// Create a context for network status
const NetworkStatusContext = createContext<ReturnType<
  typeof useNetworkStatus
> | null>(null);

interface NetworkStatusProviderProps {
  children: ReactNode;
}

const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({
  children,
}) => {
  const networkStatus = useNetworkStatus({
    showToasts: true,
    testInterval: 30000, // 30 seconds
    testEndpoint: 'https://www.google.com',
  });

  return (
    <NetworkStatusContext.Provider value={networkStatus}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatusContext = () => {
  const context = useContext(NetworkStatusContext);

  if (!context) {
    throw new Error(
      'useNetworkStatusContext must be used within a NetworkStatusProvider',
    );
  }

  return context;
};

export default NetworkStatusProvider;

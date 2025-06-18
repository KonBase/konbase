'use client';

import React from 'react';
import { ModuleProvider } from './ModuleContext';
import { Spinner } from '../ui/spinner';

interface ModuleWrapperProps {
  children: React.ReactNode;
}

export const ModuleWrapper: React.FC<ModuleWrapperProps> = ({ children }) => {
  return (
    <ModuleProvider>
      {({ isInitialized }) => (
        <>
          {!isInitialized ? (
            <div className="flex items-center justify-center h-screen">
              <Spinner size="lg" loadingText="Initializing modules..." />
            </div>
          ) : (
            children
          )}
        </>
      )}
    </ModuleProvider>
  );
};

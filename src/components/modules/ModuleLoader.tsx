'use client';

import React, { useEffect } from 'react';
import moduleRegistry from './ModuleRegistry';
import { logDebug } from '../../utils/debug/logger'; // Update the path to the correct location of the logger module

// Import your modules here
import SampleModule from '../../templates/SampleModule';

interface ModuleLoaderProps {
  children: React.ReactNode;
}

export const ModuleLoader: React.FC<ModuleLoaderProps> = ({ children }) => {
  useEffect(() => {
    const registerModules = async () => {
      try {
        // Register built-in modules
        moduleRegistry.registerModule(SampleModule);

        // You can register more modules here
        // moduleRegistry.registerModule(AnotherModule);

        logDebug('All modules registered successfully', null, 'info');
      } catch (error) {
        logDebug(
          `Error registering modules: ${error instanceof Error ? error.message : String(error)}`,
          null,
          'error',
        );
      }
    };

    registerModules();
  }, []);

  return <>{children}</>;
};

export default ModuleLoader;

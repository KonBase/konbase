'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  KonbaseModule,
  ModuleManifest,
  ModuleDashboardComponent,
} from '../../types/modules';
import moduleRegistry from './ModuleRegistry';
import moduleService from './ModuleService';
import { logDebug } from '../../utils/debug/logger'; // Updated the path to the correct location
import type { ModuleNavigationItem } from '@/types/modules';

interface ModuleContextType {
  isInitialized: boolean;
  modules: KonbaseModule[];
  manifests: ModuleManifest[];
  dashboardComponents: ModuleDashboardComponent[];
  navigationItems: ModuleNavigationItem[];
  refreshModuleState: () => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const useModules = () => {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};

interface ModuleProviderProps {
  children: React.ReactNode | ((context: ModuleContextType) => React.ReactNode);
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [modules, setModules] = useState<KonbaseModule[]>([]);
  const [manifests, setManifests] = useState<ModuleManifest[]>([]);
  const [dashboardComponents, setDashboardComponents] = useState<
    ModuleDashboardComponent[]
  >([]);
  const [navigationItems, setNavigationItems] = useState<
    ModuleNavigationItem[]
  >([]);

  const refreshModuleState = () => {
    const navItems: ModuleNavigationItem[] = [];

    // Collect dashboard components from enabled modules
    const components: ModuleDashboardComponent[] = [];

    const allModules = moduleRegistry.getAllModules();

    allModules.forEach((module) => {
      if (moduleRegistry.isModuleEnabled(module.id)) {
        // Collect dashboard components if any
        if (module.getDashboardComponents) {
          const moduleComponents = module.getDashboardComponents();
          components.push(...moduleComponents);
        }

        // Collect navigation items if any
        if (module.getNavigationItems) {
          const moduleNavItems = module.getNavigationItems();
          navItems.push(...moduleNavItems);
        }
      }
    });

    // Sort dashboard components by priority (descending)
    components.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Sort navigation items by order (ascending)
    navItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    setDashboardComponents(components);
    setNavigationItems(navItems);
  };

  useEffect(() => {
    const initializeModules = async () => {
      try {
        // Initialize the module system
        await moduleService.initialize();

        // Update state with current modules
        refreshModuleState();

        setIsInitialized(true);
      } catch (error) {
        logDebug(
          `Error initializing module system: ${error instanceof Error ? error.message : String(error)}`,
          null,
          'error',
        );
      }
    };

    initializeModules();
  }, []);

  const contextValue: ModuleContextType = {
    isInitialized,
    modules,
    manifests,
    dashboardComponents,
    navigationItems,
    refreshModuleState,
  };

  return (
    <ModuleContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
    </ModuleContext.Provider>
  );
};

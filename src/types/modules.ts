import { ReactNode } from 'react';

/**
 * Permissions that modules can request
 */
export type ModulePermission =
  | 'read:inventory'
  | 'write:inventory'
  | 'read:users'
  | 'write:users'
  | 'read:associations'
  | 'write:associations'
  | 'read:conventions'
  | 'write:conventions'
  | 'full:dashboard'
  | 'database:create-tables'
  | 'database:execute-queries'
  | 'storage:read'
  | 'storage:write';

/**
 * Basic manifest information about a module
 */
export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  requires?: string[]; // IDs of modules that this one depends on
  permissions?: ModulePermission[];
  isEnabled: boolean;
  installDate: string;
  updateDate: string;
}

/**
 * Dashboard component configuration
 */
export interface ModuleDashboardComponent {
  title: string;
  priority?: number; // Higher numbers appear first
  component: ReactNode | (() => ReactNode);
  gridSpan?: 'full' | 'half' | 'third'; // Default: 'third'
  moduleId?: string; // ID of the module that provided this component
}

/**
 * Navigation item provided by a module
 */
export interface ModuleNavigationItem {
  title: string;
  path: string;
  icon?: ReactNode;
  requiredRole?: 'member' | 'manager' | 'admin' | 'super_admin';
  parent?: string; // ID of parent menu if this is a submenu item
  moduleId?: string; // ID of the module that provided this navigation item
  order?: number; // Used for sorting navigation items
  label?: string; // Alternative to title, some components use label instead
}

/**
 * Database migration provided by a module
 */
export interface ModuleDatabaseMigration {
  version: string;
  description: string;
  sql: string;
  runOnEnable?: boolean;
}

/**
 * Settings page provided by a module
 */
export interface ModuleSettingsPage {
  title: string;
  component: ReactNode | (() => ReactNode);
  requiredRole?: 'member' | 'manager' | 'admin' | 'super_admin';
}

/**
 * Main module interface that all custom modules must implement
 */
export interface KonbaseModule {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  requires?: string[];
  permissions?: ModulePermission[];

  // Lifecycle methods
  onRegister?: () => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
  onUpdate?: (prevVersion: string) => void | Promise<void>;

  // UI components
  getDashboardComponents?: () => ModuleDashboardComponent[];
  getNavigationItems?: () => ModuleNavigationItem[];
  getSettingsPage?: () => ModuleSettingsPage | null;

  // Database
  getDatabaseMigrations?: () => ModuleDatabaseMigration[];

  // Module's custom configuration schema (if any)
  getConfigurationSchema?: () => Record<string, any> | null;
}

/**
 * Configuration for a module stored in the database
 */
export interface ModuleConfiguration {
  moduleId: string;
  settings: Record<string, any>;
  lastUpdated: string;
}

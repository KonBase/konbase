'use client';

import { supabase } from '@/lib/supabase';
import moduleRegistry from './ModuleRegistry';
import {
  ModuleManifest,
  ModuleDatabaseMigration,
  ModuleConfiguration,
} from '@/types/modules';
import { logDebug } from '@/utils/debug';

/**
 * Service that handles module integration with Supabase
 */
export class ModuleService {
  /**
   * Initialize the module system
   * This should be called during application startup
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if module system is already initialized
      if (moduleRegistry.isRegistryInitialized()) {
        return true;
      }

      // Create module tables if they don't exist
      await this.ensureModuleTables();

      // Load module state from database
      await this.loadModuleState();

      moduleRegistry.setInitialized(true);
      logDebug('Module system initialized successfully', null, 'info');
      return true;
    } catch (error) {
      logDebug(
        `Error initializing module system: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return false;
    }
  }

  /**
   * Ensure the necessary tables exist for the module system
   */
  private async ensureModuleTables(): Promise<void> {
    try {
      // Create module_manifests table if it doesn't exist
      const { error: manifestsError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.module_manifests (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            description TEXT,
            author TEXT,
            requires JSONB,
            permissions JSONB,
            is_enabled BOOLEAN DEFAULT FALSE,
            install_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
            update_date TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Enable row level security
          ALTER TABLE public.module_manifests ENABLE ROW LEVEL SECURITY;
          
          -- Only admins can manage modules
          CREATE POLICY IF NOT EXISTS "Admins can manage modules" ON public.module_manifests
            USING (
              EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
              )
            );
        `,
      });

      if (manifestsError) {
        throw new Error(
          `Failed to create module_manifests table: ${manifestsError.message}`,
        );
      }

      // Create module_configurations table if it doesn't exist
      const { error: configError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.module_configurations (
            module_id TEXT PRIMARY KEY REFERENCES public.module_manifests(id) ON DELETE CASCADE,
            settings JSONB DEFAULT '{}'::jsonb,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          
          -- Enable row level security
          ALTER TABLE public.module_configurations ENABLE ROW LEVEL SECURITY;
          
          -- Only admins can manage module configurations
          CREATE POLICY IF NOT EXISTS "Admins can manage module configurations" ON public.module_configurations
            USING (
              EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
              )
            );
        `,
      });

      if (configError) {
        throw new Error(
          `Failed to create module_configurations table: ${configError.message}`,
        );
      }

      // Create module_migrations table to track applied migrations
      const { error: migrationsError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.module_migrations (
            id SERIAL PRIMARY KEY,
            module_id TEXT NOT NULL REFERENCES public.module_manifests(id) ON DELETE CASCADE,
            version TEXT NOT NULL,
            description TEXT,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(module_id, version)
          );
          
          -- Enable row level security
          ALTER TABLE public.module_migrations ENABLE ROW LEVEL SECURITY;
          
          -- Only admins can see module migrations
          CREATE POLICY IF NOT EXISTS "Admins can manage module migrations" ON public.module_migrations
            USING (
              EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
              )
            );
        `,
      });

      if (migrationsError) {
        throw new Error(
          `Failed to create module_migrations table: ${migrationsError.message}`,
        );
      }

      logDebug('Module tables created or verified successfully', null, 'info');
    } catch (error) {
      logDebug(
        `Error ensuring module tables: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      throw error;
    }
  }

  /**
   * Load module state from the database
   */
  private async loadModuleState(): Promise<void> {
    try {
      // Load module manifests
      const { data: manifests, error: manifestsError } = await supabase
        .from('module_manifests')
        .select('*');

      if (manifestsError) {
        throw new Error(
          `Failed to load module manifests: ${manifestsError.message}`,
        );
      }

      logDebug(
        `Loaded ${manifests.length} module manifests from database`,
        null,
        'info',
      );

      // We don't restore the actual modules from DB - they need to be registered at runtime
      // This just loads their enabled/disabled state and other metadata
    } catch (error) {
      logDebug(
        `Error loading module state: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      throw error;
    }
  }

  /**
   * Save a module manifest to the database
   */
  async saveModuleManifest(manifest: ModuleManifest): Promise<boolean> {
    try {
      const { error } = await supabase.from('module_manifests').upsert(
        {
          id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          author: manifest.author,
          requires: manifest.requires || [],
          permissions: manifest.permissions || [],
          is_enabled: manifest.isEnabled,
          install_date: manifest.installDate,
          update_date: manifest.updateDate,
        },
        { onConflict: 'id' },
      );

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logDebug(
        `Error saving module manifest: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return false;
    }
  }

  /**
   * Apply database migrations for a module
   */
  async applyDatabaseMigrations(
    moduleId: string,
    migrations: ModuleDatabaseMigration[],
  ): Promise<boolean> {
    try {
      // Get previously applied migrations
      const { data: appliedMigrations, error: fetchError } = await supabase
        .from('module_migrations')
        .select('version')
        .eq('module_id', moduleId);

      if (fetchError) {
        throw fetchError;
      }

      const appliedVersions = new Set(appliedMigrations.map((m) => m.version));

      // Apply new migrations in order
      for (const migration of migrations) {
        if (!appliedVersions.has(migration.version)) {
          logDebug(
            `Applying migration ${migration.version} for module ${moduleId}`,
            null,
            'info',
          );

          // Execute migration SQL
          const { error: migrationError } = await supabase.rpc('execute_sql', {
            sql_query: migration.sql,
          });

          if (migrationError) {
            throw new Error(
              `Failed to apply migration ${migration.version}: ${migrationError.message}`,
            );
          }

          // Record the migration as applied
          const { error: recordError } = await supabase
            .from('module_migrations')
            .insert({
              module_id: moduleId,
              version: migration.version,
              description: migration.description,
            });

          if (recordError) {
            throw new Error(
              `Failed to record migration ${migration.version}: ${recordError.message}`,
            );
          }

          logDebug(
            `Successfully applied migration ${migration.version} for module ${moduleId}`,
            null,
            'info',
          );
        }
      }

      return true;
    } catch (error) {
      logDebug(
        `Error applying migrations for module ${moduleId}: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return false;
    }
  }

  /**
   * Enable a module and apply its migrations if needed
   */
  async enableModule(moduleId: string): Promise<boolean> {
    try {
      const module = moduleRegistry.getModule(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Apply migrations if provided
      if (module.getDatabaseMigrations) {
        const migrations = module.getDatabaseMigrations();
        const migrationResult = await this.applyDatabaseMigrations(
          moduleId,
          migrations,
        );
        if (!migrationResult) {
          throw new Error(`Failed to apply migrations for module ${moduleId}`);
        }
      }

      // Enable the module in the registry
      const enableResult = moduleRegistry.enableModule(moduleId);
      if (!enableResult) {
        throw new Error(`Failed to enable module ${moduleId} in registry`);
      }

      // Update the manifest in the database
      const manifest = moduleRegistry
        .getAllManifests()
        .find((m) => m.id === moduleId);
      if (manifest) {
        manifest.isEnabled = true;
        manifest.updateDate = new Date().toISOString();
        await this.saveModuleManifest(manifest);
      }

      return true;
    } catch (error) {
      logDebug(
        `Error enabling module ${moduleId}: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return false;
    }
  }

  /**
   * Disable a module
   */
  async disableModule(moduleId: string): Promise<boolean> {
    try {
      // Disable the module in the registry
      const disableResult = moduleRegistry.disableModule(moduleId);
      if (!disableResult) {
        throw new Error(`Failed to disable module ${moduleId} in registry`);
      }

      // Update the manifest in the database
      const manifest = moduleRegistry
        .getAllManifests()
        .find((m) => m.id === moduleId);
      if (manifest) {
        manifest.isEnabled = false;
        manifest.updateDate = new Date().toISOString();
        await this.saveModuleManifest(manifest);
      }

      return true;
    } catch (error) {
      logDebug(
        `Error disabling module ${moduleId}: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return false;
    }
  }

  /**
   * Get module configuration from database
   */
  async getModuleConfiguration(
    moduleId: string,
  ): Promise<ModuleConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from('module_configurations')
        .select('*')
        .eq('module_id', moduleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found, return default configuration
          return {
            moduleId,
            settings: {},
            lastUpdated: new Date().toISOString(),
          };
        }
        throw error;
      }

      return {
        moduleId: data.module_id,
        settings: data.settings,
        lastUpdated: data.last_updated,
      };
    } catch (error) {
      logDebug(
        `Error getting module configuration: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return null;
    }
  }

  /**
   * Save module configuration to database
   */
  async saveModuleConfiguration(config: ModuleConfiguration): Promise<boolean> {
    try {
      const { error } = await supabase.from('module_configurations').upsert(
        {
          module_id: config.moduleId,
          settings: config.settings,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'module_id' },
      );

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logDebug(
        `Error saving module configuration: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return false;
    }
  }
}

// Export singleton instance
const moduleService = new ModuleService();
export default moduleService;

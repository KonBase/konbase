'use client';

import { KonbaseModule, ModuleManifest } from '@/types/modules';
import { logDebug } from '@/utils/debug';

/**
 * Registry that manages all custom modules in the application
 */
class ModuleRegistry {
  private modules: Map<string, KonbaseModule> = new Map();
  private manifests: Map<string, ModuleManifest> = new Map();
  private isInitialized: boolean = false;

  /**
   * Register a new module in the system
   *
   * @param module The module to register
   * @returns True if registration was successful
   */
  registerModule(module: KonbaseModule): boolean {
    try {
      // Validate module has required fields
      if (!module.id || !module.name || !module.version) {
        logDebug(
          `Failed to register module: Missing required fields`,
          module,
          'error',
        );
        return false;
      }

      // Check if module is already registered
      if (this.modules.has(module.id)) {
        logDebug(
          `Module with ID ${module.id} is already registered`,
          null,
          'warn',
        );
        return false;
      }

      // Store module and manifest
      this.modules.set(module.id, module);
      this.manifests.set(module.id, {
        id: module.id,
        name: module.name,
        version: module.version,
        description: module.description || '',
        author: module.author || 'Unknown',
        requires: module.requires || [],
        permissions: module.permissions || [],
        isEnabled: false,
        installDate: new Date().toISOString(),
        updateDate: new Date().toISOString(),
      });

      logDebug(
        `Module ${module.name} (${module.id}) registered successfully`,
        null,
        'info',
      );
      return true;
    } catch (error) {
      logDebug(
        `Error registering module: ${error instanceof Error ? error.message : String(error)}`,
        null,
        'error',
      );
      return false;
    }
  }

  /**
   * Get a module by its ID
   */
  getModule(moduleId: string): KonbaseModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): KonbaseModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get all module manifests
   */
  getAllManifests(): ModuleManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Enable a module by ID
   */
  enableModule(moduleId: string): boolean {
    const manifest = this.manifests.get(moduleId);
    if (!manifest) return false;

    manifest.isEnabled = true;
    manifest.updateDate = new Date().toISOString();
    this.manifests.set(moduleId, manifest);

    // Call the module's onEnable method if it exists
    const module = this.modules.get(moduleId);
    if (module && typeof module.onEnable === 'function') {
      try {
        module.onEnable();
      } catch (error) {
        logDebug(
          `Error enabling module ${moduleId}: ${error instanceof Error ? error.message : String(error)}`,
          null,
          'error',
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Disable a module by ID
   */
  disableModule(moduleId: string): boolean {
    const manifest = this.manifests.get(moduleId);
    if (!manifest) return false;

    manifest.isEnabled = false;
    manifest.updateDate = new Date().toISOString();
    this.manifests.set(moduleId, manifest);

    // Call the module's onDisable method if it exists
    const module = this.modules.get(moduleId);
    if (module && typeof module.onDisable === 'function') {
      try {
        module.onDisable();
      } catch (error) {
        logDebug(
          `Error disabling module ${moduleId}: ${error instanceof Error ? error.message : String(error)}`,
          null,
          'error',
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a module is enabled
   */
  isModuleEnabled(moduleId: string): boolean {
    const manifest = this.manifests.get(moduleId);
    return manifest?.isEnabled || false;
  }

  /**
   * Check if the registry has been initialized
   */
  isRegistryInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Set the initialization status
   */
  setInitialized(status: boolean): void {
    this.isInitialized = status;
  }

  /**
   * Save module state to Supabase
   * This will be implemented in conjunction with ModuleService
   */
  async saveModuleState(): Promise<boolean> {
    // This will be implemented in ModuleService
    return true;
  }
}

// Export singleton instance
const moduleRegistry = new ModuleRegistry();
export default moduleRegistry;

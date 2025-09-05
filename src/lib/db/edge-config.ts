import { get } from '@vercel/edge-config';

// Edge Config Database Adapter
// Provides a database-like interface using Vercel Edge Config
// Perfect for configuration data, feature flags, and small datasets

export interface EdgeConfigItem {
  id: string;
  [key: string]: any;
}

export interface EdgeConfigCollection {
  [key: string]: EdgeConfigItem;
}

export class EdgeConfigDatabase {
  private edgeConfigId: string;

  constructor(edgeConfigId?: string) {
    this.edgeConfigId = edgeConfigId || process.env.EDGE_CONFIG_ID || '';
    
    if (!this.edgeConfigId) {
      throw new Error('EDGE_CONFIG_ID environment variable is required for Edge Config database');
    }
  }

  // Get a single item by key
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await get(key);
      return value as T || null;
    } catch (error) {
      console.error(`Error getting key ${key} from Edge Config:`, error);
      return null;
    }
  }

  // Get multiple items by prefix
  async getByPrefix<T = any>(prefix: string): Promise<T[]> {
    try {
      const allItems = await get(prefix) as EdgeConfigCollection;
      if (!allItems) return [];
      
      return Object.values(allItems) as T[];
    } catch (error) {
      console.error(`Error getting items with prefix ${prefix} from Edge Config:`, error);
      return [];
    }
  }

  // Get all items from a collection
  async getAll<T = any>(collection: string): Promise<T[]> {
    return this.getByPrefix<T>(collection);
  }

  // Check if Edge Config is available and accessible
  async isAvailable(): Promise<boolean> {
    try {
      // Try to read a test key to verify Edge Config is accessible
      await get('__health_check__');
      return true;
    } catch (error) {
      console.error('Edge Config is not available:', error);
      return false;
    }
  }

  // Get system configuration
  async getSystemConfig(): Promise<any> {
    return this.get('system_config');
  }

  // Get user data
  async getUser(userId: string): Promise<any> {
    return this.get(`users:${userId}`);
  }

  // Get association data
  async getAssociation(associationId: string): Promise<any> {
    return this.get(`associations:${associationId}`);
  }

  // Get all associations
  async getAssociations(): Promise<any[]> {
    return this.getByPrefix('associations');
  }

  // Get convention data
  async getConvention(conventionId: string): Promise<any> {
    return this.get(`conventions:${conventionId}`);
  }

  // Get all conventions
  async getConventions(): Promise<any[]> {
    return this.getByPrefix('conventions');
  }

  // Get inventory items
  async getInventoryItems(): Promise<any[]> {
    return this.getByPrefix('inventory_items');
  }

  // Get equipment sets
  async getEquipmentSets(): Promise<any[]> {
    return this.getByPrefix('equipment_sets');
  }

  // Health check for Edge Config
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.isAvailable();
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy'
      };
    }
  }
}

// Singleton instance
let edgeConfigDb: EdgeConfigDatabase | null = null;

export function getEdgeConfigDatabase(): EdgeConfigDatabase {
  if (!edgeConfigDb) {
    edgeConfigDb = new EdgeConfigDatabase();
  }
  return edgeConfigDb;
}

// Helper function to check if Edge Config is configured
export async function isEdgeConfigConfigured(): Promise<boolean> {
  try {
    const db = getEdgeConfigDatabase();
    return await db.isAvailable();
  } catch (error) {
    return false;
  }
}

export default EdgeConfigDatabase;

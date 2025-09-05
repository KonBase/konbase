import { getGelClient } from './gel';
import { getEdgeConfigDatabase, isEdgeConfigConfigured } from './edge-config';

// Unified database interface that can work with both PostgreSQL and Edge Config
export interface DatabaseAdapter {
  get<T = any>(key: string): Promise<T | null>;
  getByPrefix<T = any>(prefix: string): Promise<T[]>;
  getAll<T = any>(collection: string): Promise<T[]>;
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }>;
}

export class UnifiedDatabaseAdapter implements DatabaseAdapter {
  private adapter: DatabaseAdapter;
  private adapterType: 'postgresql' | 'edge-config';

  constructor(adapterType: 'postgresql' | 'edge-config' = 'postgresql') {
    this.adapterType = adapterType;
    
    if (adapterType === 'edge-config') {
      this.adapter = getEdgeConfigDatabase();
    } else {
      // Create a PostgreSQL adapter wrapper
      this.adapter = new PostgreSQLAdapter();
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  async getByPrefix<T = any>(prefix: string): Promise<T[]> {
    return this.adapter.getByPrefix<T>(prefix);
  }

  async getAll<T = any>(collection: string): Promise<T[]> {
    return this.adapter.getAll<T>(collection);
  }

  async isAvailable(): Promise<boolean> {
    return this.adapter.isAvailable();
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    return this.adapter.healthCheck();
  }

  getAdapterType(): 'postgresql' | 'edge-config' {
    return this.adapterType;
  }
}

// PostgreSQL adapter wrapper
class PostgreSQLAdapter implements DatabaseAdapter {
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = getGelClient();
      const result = await client.querySingle(`SELECT * FROM ${key}`);
      return result as T || null;
    } catch (error) {
      console.error(`Error getting ${key} from PostgreSQL:`, error);
      return null;
    }
  }

  async getByPrefix<T = any>(prefix: string): Promise<T[]> {
    try {
      const client = getGelClient();
      const result = await client.query(`SELECT * FROM ${prefix}`);
      return result as T[] || [];
    } catch (error) {
      console.error(`Error getting items with prefix ${prefix} from PostgreSQL:`, error);
      return [];
    }
  }

  async getAll<T = any>(collection: string): Promise<T[]> {
    return this.getByPrefix<T>(collection);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = getGelClient();
      await client.querySingle('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    const startTime = Date.now();
    
    try {
      const client = getGelClient();
      await client.querySingle('SELECT 1');
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

// Auto-detect database type based on environment
export function createDatabaseAdapter(): UnifiedDatabaseAdapter {
  // Check if Edge Config is configured first
  if (process.env.EDGE_CONFIG_ID) {
    return new UnifiedDatabaseAdapter('edge-config');
  }
  
  // Fall back to PostgreSQL
  return new UnifiedDatabaseAdapter('postgresql');
}

// Singleton instance
let unifiedDb: UnifiedDatabaseAdapter | null = null;

export function getUnifiedDatabase(): UnifiedDatabaseAdapter {
  if (!unifiedDb) {
    unifiedDb = createDatabaseAdapter();
  }
  return unifiedDb;
}

export default UnifiedDatabaseAdapter;

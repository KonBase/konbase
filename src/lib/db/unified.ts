import { getGelClient } from './gel';
import { getRedisClient, isRedisConfigured } from './redis';
import { RedisClientType } from 'redis';

// Unified database interface that can work with PostgreSQL and Redis
export interface DatabaseAdapter {
  get<T = any>(key: string): Promise<T | null>;
  getByPrefix<T = any>(prefix: string): Promise<T[]>;
  getAll<T = any>(collection: string): Promise<T[]>;
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }>;
}

// Redis adapter that implements DatabaseAdapter interface
class RedisAdapter implements DatabaseAdapter {
  private client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async getByPrefix<T = any>(prefix: string): Promise<T[]> {
    try {
      const keys = await this.client.keys(`${prefix}:*`);
      const values = await Promise.all(
        keys.map(async (key) => {
          const value = await this.client.get(key);
          return value ? JSON.parse(value) : null;
        })
      );
      return values.filter(Boolean) as T[];
    } catch (error) {
      console.error('Redis getByPrefix error:', error);
      return [];
    }
  }

  async getAll<T = any>(collection: string): Promise<T[]> {
    return this.getByPrefix<T>(collection);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    const startTime = Date.now();
    try {
      await this.client.ping();
      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

export class UnifiedDatabaseAdapter implements DatabaseAdapter {
  private adapter: DatabaseAdapter;
  private adapterType: 'postgresql' | 'redis';

  constructor(adapterType: 'postgresql' | 'redis' = 'postgresql') {
    this.adapterType = adapterType;
    
    if (adapterType === 'redis') {
      this.adapter = new RedisAdapter(getRedisClient());
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

  getAdapterType(): 'postgresql' | 'redis' {
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
  // Check if Redis is configured first
  if (process.env.REDIS_URL) {
    return new UnifiedDatabaseAdapter('redis');
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

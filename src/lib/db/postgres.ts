import { Pool, PoolClient } from 'pg';

// Lazy initialization to avoid build-time errors
let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (pool) {
    return pool;
  }

  // Get database URL from environment variables
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'POSTGRES_URL or DATABASE_URL environment variable is required'
    );
  }

  // Create connection pool
  pool = new Pool({
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });

  // Handle pool errors
  pool.on('error', err => {
    // eslint-disable-next-line no-console
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

// Helper function to get a client from the pool
export async function getPostgresClient(): Promise<PoolClient> {
  const pool = getPostgresPool();
  return await pool.connect();
}

// Helper function to execute a query with automatic client management
export async function executeQuery<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = await getPostgresClient();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Helper function to execute a single query
export async function executeQuerySingle<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await executeQuery<T>(query, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper function to test database connection
export async function testPostgresConnection(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await executeQuerySingle('SELECT 1 as test');
    const latency = Date.now() - startTime;
    return { status: 'healthy', latency };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('PostgreSQL connection test failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to get connection info
export function getPostgresConnectionInfo() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  return {
    type: 'postgresql',
    url: databaseUrl ? 'configured' : 'not configured',
    hasUrl: !!databaseUrl,
    environment: process.env.NODE_ENV || 'development',
  };
}

// Helper function to close the pool (useful for cleanup)
export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default getPostgresPool;

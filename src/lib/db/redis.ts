import { createClient, RedisClientType } from 'redis';

// Lazy initialization to avoid build-time errors
let redisClient: RedisClientType | null = null;

export function getRedisClient(): RedisClientType {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required for Redis connection');
  }

  redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 10000, // 10 seconds
    },
  });

  // Connect to Redis
  redisClient.connect().catch((error) => {
    console.error('Failed to connect to Redis:', error);
    throw error;
  });

  return redisClient;
}

// Helper function to check if Redis is configured
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

// Helper function to get Redis connection info
export function getRedisConnectionInfo() {
  return {
    type: 'redis',
    url: process.env.REDIS_URL ? 'configured' : 'not configured',
    hasUrl: !!process.env.REDIS_URL,
  };
}

// Helper function to test Redis connection
export async function testRedisConnection(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
  const startTime = Date.now();
  
  try {
    const client = getRedisClient();
    await client.ping();
    
    const latency = Date.now() - startTime;
    return { status: 'healthy', latency };
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return { status: 'unhealthy' };
  }
}

export default getRedisClient;

import { createClient } from 'gel';

// Vercel-compatible database adapter
// This handles connection pooling and cold start issues for serverless environments

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getVercelGelClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const geldbUrl = process.env.GEL_DATABASE_URL;
  
  if (!geldbUrl) {
    throw new Error('GEL_DATABASE_URL environment variable is required');
  }

  // For Vercel, we need to create a new connection for each request
  // due to serverless function limitations
  cachedClient = createClient(geldbUrl);
  
  return cachedClient;
}

// Helper function to execute queries with proper error handling for Vercel
export async function executeVercelQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      console.error('Database query error:', error);
      throw new Error(error.message || 'Database operation failed');
    }
    
    if (data === null) {
      throw new Error('No data returned from query');
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error in database query:', error);
    throw new Error('An unexpected database error occurred');
  }
}

// Clean up connection on function end (for Vercel)
export function cleanupVercelConnection() {
  if (cachedClient) {
    // Note: GelDB client cleanup if available
    cachedClient = null;
  }
}

import { createDataAccessLayer } from './data-access';

// Vercel-compatible database adapter
// This handles connection pooling and cold start issues for serverless environments

let cachedDataAccess: ReturnType<typeof createDataAccessLayer> | null = null;

export function getVercelDataAccess() {
  if (cachedDataAccess) {
    return cachedDataAccess;
  }

  // For Vercel, we need to create a new connection for each request
  // due to serverless function limitations
  cachedDataAccess = createDataAccessLayer();

  return cachedDataAccess;
}

// Helper function to execute queries with proper error handling for Vercel
export async function executeVercelQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  try {
    const { data, error } = await queryFn();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Database query error:', error);
      throw new Error(
        (error as { message?: string }).message || 'Database operation failed'
      );
    }

    if (data === null) {
      throw new Error('No data returned from query');
    }

    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error in database query:', error);
    throw new Error('An unexpected database error occurred');
  }
}

// Clean up connection on function end (for Vercel)
export function cleanupVercelConnection() {
  if (cachedDataAccess) {
    // Note: Data access cleanup if available
    cachedDataAccess = null;
  }
}

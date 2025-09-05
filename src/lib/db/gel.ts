import { createClient } from 'gel';

// Lazy initialization to avoid build-time errors
let geldbClient: ReturnType<typeof createClient> | null = null;

export function getGelClient() {
  if (geldbClient) {
    return geldbClient;
  }

  // Check for Vercel EdgeDB environment variables first
  const edgedbInstance = process.env.EDGEDB_INSTANCE;
  const edgedbSecretKey = process.env.EDGEDB_SECRET_KEY;
  
  if (edgedbInstance && edgedbSecretKey) {
    // Construct EdgeDB connection string for Vercel
    const edgedbUrl = `edgedb://${edgedbInstance}:${edgedbSecretKey}@edgedb.cloud`;
    geldbClient = createClient(edgedbUrl);
    return geldbClient;
  }

  // Fallback to traditional URL-based connection
  const geldbUrl = process.env.GEL_DATABASE_URL;

  if (!geldbUrl) {
    throw new Error('Either GEL_DATABASE_URL or EDGEDB_INSTANCE + EDGEDB_SECRET_KEY environment variables are required');
  }

  geldbClient = createClient(geldbUrl);
  return geldbClient;
}

// Helper function to detect connection type
export function getConnectionType(): 'vercel-edgedb' | 'url' {
  const edgedbInstance = process.env.EDGEDB_INSTANCE;
  const edgedbSecretKey = process.env.EDGEDB_SECRET_KEY;
  
  if (edgedbInstance && edgedbSecretKey) {
    return 'vercel-edgedb';
  }
  
  return 'url';
}

// Helper function to get connection info for debugging
export function getConnectionInfo() {
  const connectionType = getConnectionType();
  
  if (connectionType === 'vercel-edgedb') {
    return {
      type: 'vercel-edgedb',
      instance: process.env.EDGEDB_INSTANCE,
      hasSecretKey: !!process.env.EDGEDB_SECRET_KEY,
    };
  }
  
  return {
    type: 'url',
    url: process.env.GEL_DATABASE_URL ? 'configured' : 'not configured',
  };
}

// For backward compatibility
export const geldb = {
  get query() {
    return getGelClient().query;
  },
  get querySingle() {
    return getGelClient().querySingle;
  },
  get execute() {
    return getGelClient().execute;
  }
};

// Type-safe database queries with proper error handling
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Helper function for consistent error handling
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      console.error('Database query error:', error);
      throw new DatabaseError(error.message || 'Database operation failed', error.code);
    }
    
    if (data === null) {
      throw new DatabaseError('No data returned from query');
    }
    
    return data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    
    console.error('Unexpected error in database query:', error);
    throw new DatabaseError('An unexpected database error occurred');
  }
}

// RLS helper functions
export async function withAssociationAccess<T>(
  associationId: string,
  userId: string,
  queryFn: () => Promise<T>
): Promise<T> {
  // Verify user has access to association
  const member = await geldb.querySingle(`
    SELECT role FROM association_members 
    WHERE association_id = <str>$1 AND profile_id = <str>$2
  `, [associationId, userId]);

  if (!member) {
    throw new DatabaseError('Access denied: User is not a member of this association');
  }
  
  return queryFn();
}

export default geldb;

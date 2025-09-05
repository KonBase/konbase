import { createClient } from 'gel';

// Lazy initialization to avoid build-time errors
let geldbClient: ReturnType<typeof createClient> | null = null;

export function getGelClient() {
  if (geldbClient) {
    return geldbClient;
  }

  const geldbUrl = process.env.GEL_DATABASE_URL;

  if (!geldbUrl) {
    throw new Error('GEL_DATABASE_URL environment variable is required');
  }

  geldbClient = createClient(geldbUrl);
  return geldbClient;
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

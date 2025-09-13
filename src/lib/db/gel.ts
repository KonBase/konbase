import { createDataAccessLayer } from './data-access';

// Lazy initialization to avoid build-time errors
let dataAccess: ReturnType<typeof createDataAccessLayer> | null = null;

export function getDataAccess() {
  if (dataAccess) {
    return dataAccess;
  }

  dataAccess = createDataAccessLayer();
  return dataAccess;
}

// Helper function to detect connection type
export function getConnectionType(): 'postgres' | 'vercel' {
  const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (postgresUrl) {
    return 'postgres';
  }

  return 'vercel';
}

// Helper function to get connection info for debugging
export function getConnectionInfo() {
  const connectionType = getConnectionType();

  if (connectionType === 'postgres') {
    return {
      type: 'postgres',
      url:
        process.env.POSTGRES_URL || process.env.DATABASE_URL
          ? 'configured'
          : 'not configured',
    };
  }

  return {
    type: 'vercel',
    url: 'vercel-postgres',
  };
}

// For backward compatibility
export const geldb = {
  get query() {
    return getDataAccess().executeQuery;
  },
  get querySingle() {
    return getDataAccess().executeQuerySingle;
  },
  get execute() {
    return getDataAccess().executeQuery;
  },
};

// Type-safe database queries with proper error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Helper function for consistent error handling
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  try {
    const { data, error } = await queryFn();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Database query error:', error);
      throw new DatabaseError(
        (error as { message?: string }).message || 'Database operation failed',
        (error as { code?: string }).code
      );
    }

    if (data === null) {
      throw new DatabaseError('No data returned from query');
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    // eslint-disable-next-line no-console
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
  const dataAccess = getDataAccess();
  const member = await dataAccess.executeQuerySingle(
    `
    SELECT role FROM association_members 
    WHERE association_id = $1 AND profile_id = $2
  `,
    [associationId, userId]
  );

  if (!member) {
    throw new DatabaseError(
      'Access denied: User is not a member of this association'
    );
  }

  return queryFn();
}

export default geldb;

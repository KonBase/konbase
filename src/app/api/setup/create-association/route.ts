import { NextRequest, NextResponse } from 'next/server';
import { createDataAccessLayer } from '@/lib/db/data-access';

// Set timeout for the entire operation
const TIMEOUT_MS = 25000; // 25 seconds

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
  });

  try {
    const operationPromise = async () => {
      const {
        name,
        description,
        email,
        website,
        phone,
        address,
        adminUserId,
        databaseType = 'postgresql',
      } = await request.json();

      if (!name || !email || !adminUserId) {
        return NextResponse.json(
          {
            error: 'Name, email, and admin user ID are required',
          },
          { status: 400 }
        );
      }

      // eslint-disable-next-line no-console
      console.log('Creating association with database type:', databaseType);

      // Auto-detect database type if not specified
      let actualDatabaseType = databaseType;
      if (databaseType === 'auto' || !databaseType) {
        if (process.env.REDIS_URL) {
          actualDatabaseType = 'redis';
        } else if (
          process.env.EDGEDB_INSTANCE &&
          process.env.EDGEDB_SECRET_KEY
        ) {
          actualDatabaseType = 'postgresql'; // EdgeDB uses PostgreSQL interface
        } else if (process.env.GEL_DATABASE_URL) {
          actualDatabaseType = 'postgresql';
        } else {
          return NextResponse.json(
            {
              error: 'No database configuration found',
              suggestion:
                'Please configure REDIS_URL, EDGEDB_INSTANCE + EDGEDB_SECRET_KEY, or GEL_DATABASE_URL',
            },
            { status: 400 }
          );
        }
      }

      // eslint-disable-next-line no-console
      console.log('Using database type:', actualDatabaseType);

      // Create data access layer
      const dataAccess = createDataAccessLayer(
        actualDatabaseType as 'postgresql' | 'redis'
      );

      // Test database connection first
      // eslint-disable-next-line no-console
      console.log('Testing database connection...');
      const healthCheck = await dataAccess.healthCheck();
      // eslint-disable-next-line no-console
      console.log('Database health check:', healthCheck);

      if (healthCheck.status !== 'healthy') {
        return NextResponse.json(
          {
            error: 'Database connection failed',
            details: `Database is ${healthCheck.status}`,
            suggestion:
              'Please check your database configuration and ensure the database is accessible',
          },
          { status: 500 }
        );
      }

      // Create association
      // eslint-disable-next-line no-console
      console.log('Creating association...');
      const association = await dataAccess.createAssociation({
        name,
        description: description || undefined,
        email,
        website: website || undefined,
        phone: phone || undefined,
        address: address || undefined,
      });

      // eslint-disable-next-line no-console
      console.log('Association created with ID:', association.id);

      // Add admin user as association member
      // eslint-disable-next-line no-console
      console.log('Adding admin user as association member...');
      await dataAccess.createAssociationMember({
        association_id: association.id,
        profile_id: adminUserId,
        role: 'admin',
      });

      // eslint-disable-next-line no-console
      console.log('Association member created successfully');

      return NextResponse.json({
        success: true,
        associationId: association.id,
        message: 'Association created successfully',
        databaseType: actualDatabaseType,
        healthCheck: healthCheck,
      });
    };

    // Race between operation and timeout
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return result as NextResponse;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create association error:', error);

    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        {
          error: 'Request timeout - database operation took too long',
          suggestion: 'Please check your database connection and try again',
        },
        { status: 504 }
      );
    }

    // Provide more specific error messages
    if (error instanceof Error) {
      if (
        error.message.includes('GEL_DATABASE_URL') ||
        error.message.includes('REDIS_URL')
      ) {
        return NextResponse.json(
          {
            error: 'Database configuration is required for setup operations',
            suggestion:
              'Please provide REDIS_URL, EDGEDB_INSTANCE + EDGEDB_SECRET_KEY, or GEL_DATABASE_URL environment variable',
          },
          { status: 400 }
        );
      }

      if (
        error.message.includes('connection') ||
        error.message.includes('timeout')
      ) {
        return NextResponse.json(
          {
            error: 'Database connection failed',
            details: error.message,
            suggestion:
              'Please check your database configuration and ensure the database is accessible',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create association',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again',
      },
      { status: 500 }
    );
  }
}

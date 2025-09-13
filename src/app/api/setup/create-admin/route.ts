import { NextRequest, NextResponse } from 'next/server';
import { createDataAccessLayer } from '@/lib/db/data-access';
import { runMigrations } from '@/lib/db/migrations';
import bcrypt from 'bcryptjs';

// Set timeout for the entire operation
const TIMEOUT_MS = 25000; // 25 seconds

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
  });

  try {
    const operationPromise = async () => {
      const { firstName, lastName, email, password, enable2FA } =
        await request.json();

      if (!firstName || !lastName || !email || !password) {
        return NextResponse.json(
          {
            error: 'All fields are required',
          },
          { status: 400 }
        );
      }

      // eslint-disable-next-line no-console
      console.log('Creating admin user with PostgreSQL database');

      // Check if PostgreSQL is configured
      if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
        return NextResponse.json(
          {
            error: 'PostgreSQL database configuration not found',
            suggestion:
              'Please configure POSTGRES_URL or DATABASE_URL environment variable',
          },
          { status: 400 }
        );
      }

      // Get PostgreSQL data access layer
      const dataAccess = createDataAccessLayer('postgresql');

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

      // Run database migrations
      // eslint-disable-next-line no-console
      console.log('Running database migrations...');
      const migrationResult = await runMigrations();

      if (migrationResult.error) {
        return NextResponse.json(
          {
            error: 'Database migration failed',
            details: migrationResult.error,
            suggestion:
              'Please check your database configuration and try again',
          },
          { status: 500 }
        );
      }

      // eslint-disable-next-line no-console
      console.log('Migrations completed:', {
        applied: migrationResult.applied.length,
        skipped: migrationResult.skipped.length,
      });

      // Check if user already exists
      // eslint-disable-next-line no-console
      console.log('Checking for existing user...');
      const existingUser = await dataAccess.getUserByEmail(email);

      if (existingUser) {
        return NextResponse.json(
          {
            error: 'User with this email already exists',
          },
          { status: 400 }
        );
      }

      // Hash password
      // eslint-disable-next-line no-console
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      // eslint-disable-next-line no-console
      console.log('Creating user...');
      const user = await dataAccess.createUser({
        email,
        hashed_password: hashedPassword,
        role: 'super_admin',
      });

      // eslint-disable-next-line no-console
      console.log('User created with ID:', user.id);

      // Create profile
      // eslint-disable-next-line no-console
      console.log('Creating profile...');
      await dataAccess.createProfile({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        two_factor_enabled: enable2FA,
      });

      // eslint-disable-next-line no-console
      console.log('Profile created successfully');

      return NextResponse.json({
        success: true,
        userId: user.id,
        message: 'Admin user created successfully',
        databaseType: 'postgresql',
        healthCheck: healthCheck,
        migrations: {
          applied: migrationResult.applied,
          skipped: migrationResult.skipped,
        },
      });
    };

    // Race between operation and timeout
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return result as NextResponse;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create admin error:', error);

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
        error.message.includes('POSTGRES_URL') ||
        error.message.includes('DATABASE_URL')
      ) {
        return NextResponse.json(
          {
            error: 'PostgreSQL database configuration is required',
            suggestion:
              'Please provide POSTGRES_URL or DATABASE_URL environment variable',
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
              'Please check your PostgreSQL database configuration and ensure the database is accessible',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again',
      },
      { status: 500 }
    );
  }
}

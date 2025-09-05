import { NextRequest, NextResponse } from 'next/server';
import { createDataAccessLayer } from '@/lib/db/data-access';
import bcrypt from 'bcryptjs';

// Set timeout for the entire operation
const TIMEOUT_MS = 25000; // 25 seconds

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
  });

  try {
    const operationPromise = async () => {
      const { 
        firstName, 
        lastName, 
        email, 
        password, 
        enable2FA, 
        databaseType = 'postgresql'
      } = await request.json();

      if (!firstName || !lastName || !email || !password) {
        return NextResponse.json({ 
          error: 'All fields are required' 
        }, { status: 400 });
      }

      console.log('Creating admin user with database type:', databaseType);

      // Auto-detect database type if not specified
      let actualDatabaseType = databaseType;
      if (databaseType === 'auto' || !databaseType) {
        if (process.env.REDIS_URL) {
          actualDatabaseType = 'redis';
        } else if (process.env.EDGEDB_INSTANCE && process.env.EDGEDB_SECRET_KEY) {
          actualDatabaseType = 'postgresql'; // EdgeDB uses PostgreSQL interface
        } else if (process.env.GEL_DATABASE_URL) {
          actualDatabaseType = 'postgresql';
        } else {
          return NextResponse.json({ 
            error: 'No database configuration found',
            suggestion: 'Please configure REDIS_URL, EDGEDB_INSTANCE + EDGEDB_SECRET_KEY, or GEL_DATABASE_URL'
          }, { status: 400 });
        }
      }

      console.log('Using database type:', actualDatabaseType);
      
      // Create data access layer with timeout
      const dataAccess = createDataAccessLayer(actualDatabaseType as 'postgresql' | 'redis');

      // Test database connection first
      console.log('Testing database connection...');
      const healthCheck = await dataAccess.healthCheck();
      console.log('Database health check:', healthCheck);

      if (healthCheck.status !== 'healthy') {
        return NextResponse.json({ 
          error: 'Database connection failed',
          details: `Database is ${healthCheck.status}`,
          suggestion: 'Please check your database configuration and ensure the database is accessible'
        }, { status: 500 });
      }

      // Check if user already exists
      console.log('Checking for existing user...');
      const existingUser = await dataAccess.getUserByEmail(email);

      if (existingUser) {
        return NextResponse.json({ 
          error: 'User with this email already exists' 
        }, { status: 400 });
      }

      // Hash password
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      console.log('Creating user...');
      const user = await dataAccess.createUser({
        email,
        hashed_password: hashedPassword,
        role: 'super_admin'
      });

      console.log('User created with ID:', user.id);

      // Create profile
      console.log('Creating profile...');
      await dataAccess.createProfile({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        two_factor_enabled: enable2FA
      });

      console.log('Profile created successfully');

      return NextResponse.json({
        success: true,
        userId: user.id,
        message: 'Admin user created successfully',
        databaseType: actualDatabaseType,
        healthCheck: healthCheck
      });
    };

    // Race between operation and timeout
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return result as NextResponse;

  } catch (error) {
    console.error('Create admin error:', error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { 
          error: 'Request timeout - database operation took too long',
          suggestion: 'Please check your database connection and try again'
        },
        { status: 504 }
      );
    }
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Edge Config is read-only')) {
        return NextResponse.json(
          { 
            error: 'Edge Config is read-only in production. Please use PostgreSQL for setup operations.',
            suggestion: 'Set DATABASE_TYPE=postgresql or provide GEL_DATABASE_URL for setup'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('GEL_DATABASE_URL') || error.message.includes('REDIS_URL')) {
        return NextResponse.json(
          { 
            error: 'Database configuration is required for setup operations',
            suggestion: 'Please provide REDIS_URL, EDGEDB_INSTANCE + EDGEDB_SECRET_KEY, or GEL_DATABASE_URL environment variable'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Database connection failed',
            details: error.message,
            suggestion: 'Please check your database configuration and ensure the database is accessible'
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create admin user', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again'
      },
      { status: 500 }
    );
  }
}

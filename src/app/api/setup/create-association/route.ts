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
      const { name, description, website, email, phone, address, adminUserId } =
        await request.json();

      if (!name || !adminUserId) {
        return NextResponse.json(
          {
            error: 'Association name and admin user ID are required',
          },
          { status: 400 }
        );
      }

      // eslint-disable-next-line no-console
      console.log('Creating association:', name);

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

      // Check if admin user exists
      // eslint-disable-next-line no-console
      console.log('Checking admin user...');
      const adminUser = await dataAccess.getUserById(adminUserId);

      if (!adminUser) {
        return NextResponse.json(
          {
            error: 'Admin user not found',
            suggestion: 'Please create an admin user first',
          },
          { status: 400 }
        );
      }

      // Get admin user profile
      const adminProfile = await dataAccess.getProfileByUserId(adminUserId);

      if (!adminProfile) {
        return NextResponse.json(
          {
            error: 'Admin user profile not found',
            suggestion: 'Please complete admin user setup first',
          },
          { status: 400 }
        );
      }

      // Check if association already exists
      // eslint-disable-next-line no-console
      console.log('Checking for existing association...');
      const existingAssociations = await dataAccess.getAllAssociations();
      const existingAssociation = existingAssociations.find(
        assoc => assoc.name.toLowerCase() === name.toLowerCase()
      );

      if (existingAssociation) {
        return NextResponse.json(
          {
            error: 'Association with this name already exists',
            suggestion: 'Please choose a different name',
          },
          { status: 400 }
        );
      }

      // Create association
      // eslint-disable-next-line no-console
      console.log('Creating association...');
      const association = await dataAccess.createAssociation({
        name,
        description: description || null,
        website: website || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      });

      // eslint-disable-next-line no-console
      console.log('Association created with ID:', association.id);

      // Add admin user as association member
      // eslint-disable-next-line no-console
      console.log('Adding admin user as association member...');
      await dataAccess.createAssociationMember({
        association_id: association.id,
        profile_id: adminProfile.user_id,
        role: 'admin',
      });

      // eslint-disable-next-line no-console
      console.log('Admin user added as association member');

      return NextResponse.json({
        success: true,
        associationId: association.id,
        message: 'Association created successfully',
        association: {
          id: association.id,
          name: association.name,
          description: association.description,
          website: association.website,
          email: association.email,
          phone: association.phone,
          address: association.address,
          created_at: association.created_at,
        },
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
        error: 'Failed to create association',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createDataAccessLayer } from '@/lib/db/data-access';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
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

    // Edge Config is read-only in production, so we need to use PostgreSQL for setup
    const actualDatabaseType = databaseType === 'edge-config' ? 'postgresql' : databaseType;
    
    // Create data access layer
    const dataAccess = createDataAccessLayer(actualDatabaseType);

    // Check if user already exists
    const existingUser = await dataAccess.getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await dataAccess.createUser({
      email,
      hashed_password: hashedPassword,
      role: 'super_admin'
    });

    // Create profile
    await dataAccess.createProfile({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`,
      two_factor_enabled: enable2FA
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Admin user created successfully',
      note: databaseType === 'edge-config' ? 'Admin created in PostgreSQL (Edge Config is read-only for setup)' : undefined
    });
  } catch (error) {
    console.error('Create admin error:', error);
    
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
      
      if (error.message.includes('GEL_DATABASE_URL')) {
        return NextResponse.json(
          { 
            error: 'PostgreSQL database URL is required for setup operations',
            suggestion: 'Please provide GEL_DATABASE_URL environment variable'
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create admin user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

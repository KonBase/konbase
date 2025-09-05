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

    // Create data access layer
    const dataAccess = createDataAccessLayer(databaseType);

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
      message: 'Admin user created successfully'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

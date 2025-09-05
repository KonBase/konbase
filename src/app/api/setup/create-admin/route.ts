import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'gel';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      enable2FA, 
      connectionString 
    } = await request.json();

    if (!firstName || !lastName || !email || !password || !connectionString) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    // Create database client
    const client = createClient(connectionString);

    // Check if user already exists
    const existingUser = await client.querySingle(`
      SELECT id FROM users WHERE email = <str>$1
    `, [email]);

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await client.querySingle(`
      INSERT INTO users (
        email, 
        hashed_password, 
        role, 
        created_at
      ) VALUES (
        <str>$1, <str>$2, <str>$3, NOW()
      )
      RETURNING id, email, role
    `, [email, hashedPassword, 'super_admin']);

    // Create profile
    await client.query(`
      INSERT INTO profiles (
        user_id, 
        first_name, 
        last_name, 
        display_name,
        two_factor_enabled,
        created_at
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4, <bool>$5, NOW()
      )
    `, [
      (user as any).id, 
      firstName, 
      lastName, 
      `${firstName} ${lastName}`,
      enable2FA
    ]);

    return NextResponse.json({
      success: true,
      userId: (user as any).id,
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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer('postgresql');

    // Check if user is super admin
    const user = (await dataAccess.executeQuerySingle(
      `
      SELECT role FROM users WHERE id = $1
    `,
      [session.user.id]
    )) as { role: string } | null;

    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: string[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause = `WHERE u.email ILIKE $${paramIndex} OR p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get users with profile and association counts
    const users = await dataAccess.executeQuery(
      `
      SELECT 
        u.*,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.two_factor_enabled,
        p.totp_secret,
        COUNT(DISTINCT am.id) as association_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN association_members am ON u.id = am.profile_id
      ${whereClause}
      GROUP BY u.id, p.first_name, p.last_name, p.avatar_url, p.two_factor_enabled, p.totp_secret
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset]
    );

    // Get total count for pagination
    const totalCount = (await dataAccess.executeQuerySingle(
      `
      SELECT COUNT(*) as count FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ${whereClause}
    `,
      params
    )) as { count: number } | null;

    const totalPages = Math.ceil((totalCount?.count || 0) / limit);

    return NextResponse.json({
      data: {
        data: users || [],
        pagination: {
          page,
          limit,
          totalCount: totalCount?.count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer('postgresql');

    // Check if user is super admin
    const user = (await dataAccess.executeQuerySingle(
      `
      SELECT role FROM users WHERE id = $1
    `,
      [session.user.id]
    )) as { role: string } | null;

    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, role = 'member', password } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await dataAccess.executeQuerySingle(
      `
      SELECT id FROM users WHERE email = $1
    `,
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const newUser = (await dataAccess.executeQuerySingle(
      `
      INSERT INTO users (
        email, role, hashed_password
      ) VALUES (
        $1, $2, $3
      )
      RETURNING *
    `,
      [email, role, password ? await bcrypt.hash(password, 12) : null]
    )) as {
      id: string;
      email: string;
      role: string;
      created_at: string;
    } | null;

    // Create profile
    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user', success: false },
        { status: 500 }
      );
    }

    await dataAccess.executeQuery(
      `
      INSERT INTO profiles (
        user_id, first_name, last_name
      ) VALUES (
        $1, $2, $3
      )
    `,
      [newUser.id, firstName, lastName]
    );

    return NextResponse.json(
      {
        data: newUser,
        success: true,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', success: false },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb } from '@/lib/db/gel';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await geldb.querySingle(`
      SELECT role FROM users WHERE id = <str>$1
    `, [session.user.id]) as any;

    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause = `WHERE u.email ILIKE <str>$${paramIndex} OR p.first_name ILIKE <str>$${paramIndex} OR p.last_name ILIKE <str>$${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get users with profile and association counts
    const users = await geldb.query(`
      SELECT 
        u.*,
        p.first_name,
        p.last_name,
        p.phone,
        p.avatar_url,
        p.two_factor_enabled,
        p.totp_secret,
        COUNT(DISTINCT am.id) as association_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN association_members am ON u.id = am.profile_id
      ${whereClause}
      GROUP BY u.id, p.first_name, p.last_name, p.phone, p.avatar_url, p.two_factor_enabled, p.totp_secret
      ORDER BY u.created_at DESC
      LIMIT <int>$${paramIndex} OFFSET <int>$${paramIndex + 1}
    `, [...params, limit, offset]);

    // Get total count for pagination
    const totalCount = await geldb.querySingle(`
      SELECT COUNT(*) as count FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ${whereClause}
    `, params) as any;

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
        }
      },
      success: true
    });
  } catch (error) {
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

    // Check if user is super admin
    const user = await geldb.querySingle(`
      SELECT role FROM users WHERE id = <str>$1
    `, [session.user.id]) as any;

    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, phone, role = 'member', password } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, first name, and last name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await geldb.querySingle(`
      SELECT id FROM users WHERE email = <str>$1
    `, [email]);

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create user
    const newUser = await geldb.querySingle(`
      INSERT INTO users (
        email, role, hashed_password
      ) VALUES (
        <str>$1, <str>$2, <str>$3
      )
      RETURNING *
    `, [email, role, password ? await bcrypt.hash(password, 12) : null]) as any;

    // Create profile
    await geldb.query(`
      INSERT INTO profiles (
        user_id, first_name, last_name, phone
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4
      )
    `, [newUser.id, firstName, lastName, phone || null]);

    return NextResponse.json({
      data: newUser,
      success: true,
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', success: false },
      { status: 500 }
    );
  }
}

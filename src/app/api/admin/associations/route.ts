import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb } from '@/lib/db/gel';

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
      whereClause = `WHERE a.name ILIKE <str>$${paramIndex} OR a.email ILIKE <str>$${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get associations with counts
    const associations = await geldb.query(`
      SELECT 
        a.*,
        COUNT(DISTINCT am.id) as member_count,
        COUNT(DISTINCT c.id) as convention_count,
        COUNT(DISTINCT i.id) as item_count
      FROM associations a
      LEFT JOIN association_members am ON a.id = am.association_id
      LEFT JOIN conventions c ON a.id = c.association_id
      LEFT JOIN items i ON a.id = i.association_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT <int>$${paramIndex} OFFSET <int>$${paramIndex + 1}
    `, [...params, limit, offset]);

    // Get total count for pagination
    const totalCount = await geldb.querySingle(`
      SELECT COUNT(*) as count FROM associations a
      ${whereClause}
    `, params) as any;

    const totalPages = Math.ceil((totalCount?.count || 0) / limit);

    return NextResponse.json({
      data: {
        data: associations || [],
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
    console.error('Admin associations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations', success: false },
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
    const { name, description, email, website, status = 'active' } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Create association
    const association = await geldb.querySingle(`
      INSERT INTO associations (
        name, description, email, website, status
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4, <str>$5
      )
      RETURNING *
    `, [name, description || null, email, website || null, status]);

    return NextResponse.json({
      data: association,
      success: true,
      message: 'Association created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create association error:', error);
    return NextResponse.json(
      { error: 'Failed to create association', success: false },
      { status: 500 }
    );
  }
}

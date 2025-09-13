import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
import { z } from 'zod';

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'manager', 'admin']),
  expiresIn: z
    .string()
    .refine(val => ['1', '3', '7', '14', '30'].includes(val), {
      message: 'Invalid expiry period',
    }),
  message: z.string().optional(),
});

// GET /api/invitations - List invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE i.association_id = $1';
    const params = [associationId];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND i.email ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get invitations
    const invitations = await dataAccess.executeQuery(
      `
      SELECT 
        i.*,
        p.first_name,
        p.last_name
      FROM invitations i
      LEFT JOIN profiles p ON i.invited_by = p.user_id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset]
    );

    // Get total count for pagination
    const totalCount = (await dataAccess.executeQuerySingle(
      `
      SELECT COUNT(*) as count FROM invitations i
      ${whereClause}
    `,
      params
    )) as { count: number } | null;

    const totalPages = Math.ceil((totalCount?.count || 0) / limit);

    return NextResponse.json({
      data: {
        data: invitations || [],
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
    console.error('Invitations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations', success: false },
      { status: 500 }
    );
  }
}

// POST /api/invitations - Create invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();
    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createInvitationSchema.parse(body);

    // Check if user already exists
    const existingUser = await dataAccess.executeQuerySingle(
      `
      SELECT id FROM users WHERE email = $1
    `,
      [validatedData.email]
    );

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User with this email already exists',
        },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await dataAccess.executeQuerySingle(
      `
      SELECT id FROM invitations 
      WHERE email = $1 AND association_id = $2 AND status = 'pending'
    `,
      [validatedData.email, associationId]
    );

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: 'Pending invitation already exists for this email',
        },
        { status: 400 }
      );
    }

    // Generate invitation code
    const code = generateInvitationCode();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(validatedData.expiresIn));

    // Create invitation
    const invitation = await dataAccess.executeQuerySingle(
      `
      INSERT INTO invitations (
        association_id,
        email,
        role,
        code,
        expires_at,
        message,
        invited_by,
        status,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      )
      RETURNING *
    `,
      [
        associationId,
        validatedData.email,
        validatedData.role,
        code,
        expiresAt.toISOString(),
        validatedData.message || null,
        session.user.id,
        'pending',
      ]
    );

    return NextResponse.json(
      {
        data: invitation,
        success: true,
        message: 'Invitation created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors, success: false },
        { status: 400 }
      );
    }

    // eslint-disable-next-line no-console
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation', success: false },
      { status: 500 }
    );
  }
}

function generateInvitationCode(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

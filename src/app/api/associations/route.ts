import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb, executeQuery } from '@/lib/db/gel';
import { associationSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/associations - List user's associations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const associations = await geldb.query(`
      SELECT 
        am.id,
        am.role,
        am.joined_at,
        a.id as association_id,
        a.name as association_name,
        a.description as association_description,
        a.email as association_email,
        a.website as association_website,
        a.logo_url as association_logo_url
      FROM association_members am
      JOIN associations a ON am.association_id = a.id
      WHERE am.profile_id = <str>$1
      ORDER BY am.joined_at DESC
    `, [session.user.id]) as any;

    return NextResponse.json({ data: associations, success: true });
  } catch (error) {
    console.error('Error fetching associations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations', success: false },
      { status: 500 }
    );
  }
}

// POST /api/associations - Create new association
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = associationSchema.parse(body);

    // Create association
    const association = await geldb.querySingle(`
      INSERT INTO associations (
        name, description, email, website, phone, address
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4, <str>$5, <str>$6
      )
      RETURNING *
    `, [
      validatedData.name,
      validatedData.description || null,
      validatedData.email || null,
      validatedData.website || null,
      validatedData.phone || null,
      validatedData.address || null
    ]) as any;

    // Add creator as admin
    await geldb.query(`
      INSERT INTO association_members (
        association_id, profile_id, role
      ) VALUES (
        <str>$1, <str>$2, <str>$3
      )
    `, [association.id, session.user.id, 'admin']);

    return NextResponse.json({ 
      data: association, 
      success: true,
      message: 'Association created successfully' 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors, success: false },
        { status: 400 }
      );
    }

    console.error('Error creating association:', error);
    return NextResponse.json(
      { error: 'Failed to create association', success: false },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb, executeQuery } from '@/lib/db/gel';
import { conventionSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/conventions - List conventions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json({ error: 'Association ID required' }, { status: 400 });
    }

    let whereClause = 'WHERE c.association_id = <str>$1';
    const params = [associationId];
    let paramIndex = 2;

    if (query) {
      whereClause += ` AND c.name ILIKE <str>$${paramIndex}`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND c.status = <str>$${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const conventions = await geldb.query(`
      SELECT 
        c.*,
        COUNT(cm.id) as member_count,
        COUNT(ce.id) as equipment_count
      FROM conventions c
      LEFT JOIN convention_members cm ON c.id = cm.convention_id
      LEFT JOIN convention_equipment ce ON c.id = ce.convention_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.start_date DESC
    `, params);

    return NextResponse.json({ data: conventions, success: true });
  } catch (error) {
    console.error('Error fetching conventions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conventions', success: false },
      { status: 500 }
    );
  }
}

// POST /api/conventions - Create new convention
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = conventionSchema.parse(body);

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json({ error: 'Association ID required' }, { status: 400 });
    }

    // Create convention
    const convention = await geldb.querySingle(`
      INSERT INTO conventions (
        association_id, 
        name, 
        description, 
        start_date, 
        end_date, 
        location, 
        status
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4, <str>$5, <str>$6, <str>$7
      )
      RETURNING *
    `, [
      associationId,
      validatedData.name,
      validatedData.description || null,
      validatedData.startDate,
      validatedData.endDate,
      validatedData.location || null,
      validatedData.status || 'planning'
    ]) as any;

    // Add creator as admin
    await geldb.query(`
      INSERT INTO convention_members (
        convention_id, 
        profile_id, 
        role
      ) VALUES (
        <str>$1, <str>$2, <str>$3
      )
    `, [convention.id, session.user.id, 'admin']);

    return NextResponse.json({ 
      data: convention, 
      success: true,
      message: 'Convention created successfully' 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors, success: false },
        { status: 400 }
      );
    }

    console.error('Error creating convention:', error);
    return NextResponse.json(
      { error: 'Failed to create convention', success: false },
      { status: 500 }
    );
  }
}

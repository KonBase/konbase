import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
import { equipmentSetSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/inventory/equipment-sets - List equipment sets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    let whereClause = 'WHERE es.association_id = $1';
    const params = [associationId];
    let paramIndex = 2;

    if (query) {
      whereClause += ` AND es.name ILIKE $${paramIndex}`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    const equipmentSets = await dataAccess.executeQuery(
      `
      SELECT 
        es.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', esi.id,
              'itemId', esi.item_id,
              'quantity', esi.quantity,
              'item', json_build_object(
                'id', i.id,
                'name', i.name,
                'description', i.description,
                'condition', i.condition
              )
            )
          ) FILTER (WHERE esi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM equipment_sets es
      LEFT JOIN equipment_set_items esi ON es.id = esi.equipment_set_id
      LEFT JOIN items i ON esi.item_id = i.id
      ${whereClause}
      GROUP BY es.id
      ORDER BY es.created_at DESC
    `,
      params
    );

    return NextResponse.json({ data: equipmentSets, success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching equipment sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment sets', success: false },
      { status: 500 }
    );
  }
}

// POST /api/inventory/equipment-sets - Create new equipment set
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();

    const body = await request.json();
    const validatedData = equipmentSetSchema.parse(body);

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    // Create equipment set
    const equipmentSet = (await dataAccess.executeQuerySingle(
      `
      INSERT INTO equipment_sets (
        association_id, 
        name, 
        description
      ) VALUES (
        $1, $2, $3
      )
      RETURNING *
    `,
      [associationId, validatedData.name, validatedData.description || null]
    )) as { id: string } | null;

    // Add items to the set
    if (equipmentSet && validatedData.items && validatedData.items.length > 0) {
      for (const item of validatedData.items) {
        await dataAccess.executeQuery(
          `
          INSERT INTO equipment_set_items (
            equipment_set_id, 
            item_id, 
            quantity
          ) VALUES (
            $1, $2, $3
          )
        `,
          [equipmentSet.id, item.itemId, item.quantity]
        );
      }
    }

    return NextResponse.json(
      {
        data: equipmentSet,
        success: true,
        message: 'Equipment set created successfully',
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
    console.error('Error creating equipment set:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment set', success: false },
      { status: 500 }
    );
  }
}

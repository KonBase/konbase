import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
import { itemSchema, itemFilterSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/inventory/items - List items with filtering
export async function GET(request: NextRequest) {
  const dataAccess = createDataAccessLayer();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries()) as Record<
      string,
      string
    >;

    // Normalize params and convert numeric strings
    const normalizedParams: Record<string, string | number> = { ...rawParams };
    if (rawParams.page) normalizedParams.page = parseInt(rawParams.page, 10);
    if (rawParams.limit) normalizedParams.limit = parseInt(rawParams.limit, 10);

    const validatedParams = itemFilterSchema.parse(normalizedParams);
    const {
      page = 1,
      limit = 20,
      query,
      categoryId,
      locationId,
      condition,
      sortBy = 'name',
      sortOrder = 'asc',
    } = validatedParams;

    // Get association ID from header or session
    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    // Build dynamic query
    const whereConditions = ['i.association_id = <str>$1'];
    const dbParams: string[] = [associationId];
    let paramIndex = 2;

    if (query) {
      whereConditions.push(`i.name ILIKE <str>$${paramIndex}`);
      dbParams.push(`%${query}%`);
      paramIndex++;
    }
    if (categoryId) {
      whereConditions.push(`i.category_id = <str>$${paramIndex}`);
      dbParams.push(categoryId);
      paramIndex++;
    }
    if (locationId) {
      whereConditions.push(`i.location_id = <str>$${paramIndex}`);
      dbParams.push(locationId);
      paramIndex++;
    }
    if (condition) {
      whereConditions.push(`i.condition = <str>$${paramIndex}`);
      dbParams.push(condition);
      paramIndex++;
    }

    const orderClause = `ORDER BY i.${sortBy} ${sortOrder.toUpperCase()}`;
    const limitClause = `LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    const items = (await dataAccess.executeQuery(
      `
      SELECT 
        i.*,
        c.id as category_id,
        c.name as category_name,
        l.id as location_id,
        l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE ${whereConditions.join(' AND ')}
      ${orderClause}
      ${limitClause}
    `,
      dbParams
    )) as unknown;

    // Get total count for pagination
    const countResult = await dataAccess.executeQuerySingle<{
      count: number | string;
    }>(
      `
      SELECT COUNT(*) as count
      FROM items i
      WHERE ${whereConditions.join(' AND ')}
    `,
      dbParams
    );
    const count = Number(countResult?.count ?? 0);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      success: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors, success: false },
        { status: 400 }
      );
    }

    // eslint-disable-next-line no-console
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items', success: false },
      { status: 500 }
    );
  }
}

// POST /api/inventory/items - Create new item
export async function POST(request: NextRequest) {
  const dataAccess = createDataAccessLayer();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const associationId = request.headers.get('x-association-id');
    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = itemSchema.parse(body);

    // Add association_id to the data
    const itemData = {
      ...validatedData,
      association_id: associationId,
    };

    const item = (await dataAccess.executeQuerySingle(
      `
      INSERT INTO items (
        association_id, name, description, serial_number, 
        category_id, location_id, condition, purchase_price, 
        purchase_date, warranty_expires, notes
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4, <str>$5, <str>$6, <str>$7, <decimal>$8, <date>$9, <date>$10, <str>$11
      )
      RETURNING *
    `,
      [
        itemData.association_id,
        itemData.name,
        itemData.description || null,
        itemData.serialNumber || null,
        itemData.categoryId || null,
        itemData.locationId || null,
        itemData.condition || 'good',
        itemData.purchasePrice || null,
        itemData.purchaseDate || null,
        itemData.warrantyExpires || null,
        itemData.notes || null,
      ]
    )) as unknown;

    return NextResponse.json(
      {
        data: item,
        success: true,
        message: 'Item created successfully',
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
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item', success: false },
      { status: 500 }
    );
  }
}

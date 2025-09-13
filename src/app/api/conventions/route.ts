import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
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
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const dataAccess = createDataAccessLayer('postgresql');
    let conventions =
      await dataAccess.getConventionsByAssociation(associationId);

    // Apply filters
    if (query) {
      conventions = conventions.filter(conv =>
        conv.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (status) {
      conventions = conventions.filter(conv => conv.status === status);
    }

    // Add mock counts for now (in a real implementation, these would be calculated)
    const conventionsWithCounts = conventions.map(conv => ({
      ...conv,
      member_count: 0, // TODO: Calculate actual member count
      equipment_count: 0, // TODO: Calculate actual equipment count
    }));

    return NextResponse.json({ data: conventionsWithCounts, success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
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
      return NextResponse.json(
        { error: 'Association ID required' },
        { status: 400 }
      );
    }

    const dataAccess = createDataAccessLayer('postgresql');

    // Create convention
    const convention = await dataAccess.createConvention({
      association_id: associationId,
      name: validatedData.name,
      description: validatedData.description || undefined,
      start_date: validatedData.startDate,
      end_date: validatedData.endDate,
      location: validatedData.location || undefined,
      status: validatedData.status || 'planning',
    });

    // Add creator as admin
    await dataAccess.createConventionMember({
      convention_id: convention.id,
      profile_id: session.user.id,
      role: 'admin',
    });

    return NextResponse.json(
      {
        data: convention,
        success: true,
        message: 'Convention created successfully',
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
    console.error('Error creating convention:', error);
    return NextResponse.json(
      { error: 'Failed to create convention', success: false },
      { status: 500 }
    );
  }
}

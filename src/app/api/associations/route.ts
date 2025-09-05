import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getDataAccess } from '@/lib/db/data-access';
import { associationSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/associations - List user's associations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = getDataAccess();
    const associations = await dataAccess.getAssociationMembersByProfileId(session.user.id);

    // Transform data to match expected format
    const formattedAssociations = associations.map(member => ({
      id: member.id,
      role: member.role,
      joined_at: member.created_at,
      association_id: member.association_id,
      association_name: member.association_name,
      association_description: null, // Will be populated from association data
      association_email: null,
      association_website: null,
      association_logo_url: null
    }));

    return NextResponse.json({ data: formattedAssociations, success: true });
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

    const dataAccess = getDataAccess();

    // Create association
    const association = await dataAccess.createAssociation({
      name: validatedData.name,
      description: validatedData.description || undefined,
      email: validatedData.email || undefined,
      website: validatedData.website || undefined,
      phone: validatedData.phone || undefined,
      address: validatedData.address || undefined
    });

    // Add creator as admin
    await dataAccess.createAssociationMember({
      association_id: association.id,
      profile_id: session.user.id,
      role: 'admin'
    });

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

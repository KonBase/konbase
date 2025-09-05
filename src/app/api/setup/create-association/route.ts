import { NextRequest, NextResponse } from 'next/server';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      description, 
      email, 
      website, 
      phone, 
      address, 
      type, 
      status,
      adminUserId,
      databaseType = 'postgresql'
    } = await request.json();

    if (!name || !email || !adminUserId) {
      return NextResponse.json({ 
        error: 'Name, email, and admin user ID are required' 
      }, { status: 400 });
    }

    // Create data access layer
    const dataAccess = createDataAccessLayer(databaseType);

    // Create association
    const association = await dataAccess.createAssociation({
      name,
      description: description || undefined,
      email,
      website: website || undefined,
      phone: phone || undefined,
      address: address || undefined
    });

    // Add admin user as association member
    await dataAccess.createAssociationMember({
      association_id: association.id,
      profile_id: adminUserId,
      role: 'admin'
    });

    return NextResponse.json({
      success: true,
      associationId: association.id,
      message: 'Association created successfully'
    });
  } catch (error) {
    console.error('Create association error:', error);
    return NextResponse.json(
      { error: 'Failed to create association' },
      { status: 500 }
    );
  }
}

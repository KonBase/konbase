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

    // Edge Config is read-only in production, so we need to use PostgreSQL for setup
    const actualDatabaseType = databaseType === 'edge-config' ? 'postgresql' : databaseType;
    
    // Create data access layer
    const dataAccess = createDataAccessLayer(actualDatabaseType);

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
      message: 'Association created successfully',
      note: databaseType === 'edge-config' ? 'Association created in PostgreSQL (Edge Config is read-only for setup)' : undefined
    });
  } catch (error) {
    console.error('Create association error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Edge Config is read-only')) {
        return NextResponse.json(
          { 
            error: 'Edge Config is read-only in production. Please use PostgreSQL for setup operations.',
            suggestion: 'Set DATABASE_TYPE=postgresql or provide GEL_DATABASE_URL for setup'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('GEL_DATABASE_URL')) {
        return NextResponse.json(
          { 
            error: 'PostgreSQL database URL is required for setup operations',
            suggestion: 'Please provide GEL_DATABASE_URL environment variable'
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create association', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

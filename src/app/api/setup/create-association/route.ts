import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'gel';

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
      adminUserId 
    } = await request.json();

    if (!name || !email || !adminUserId) {
      return NextResponse.json({ 
        error: 'Name, email, and admin user ID are required' 
      }, { status: 400 });
    }

    // Get connection string from environment or use the one from setup
    const connectionString = process.env.GEL_DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ 
        error: 'Database connection not configured' 
      }, { status: 500 });
    }

    const client = createClient(connectionString);

    // Create association
    const association = await client.querySingle(`
      INSERT INTO associations (
        name, 
        description, 
        email, 
        website, 
        phone, 
        address, 
        type, 
        status,
        created_at
      ) VALUES (
        <str>$1, <str>$2, <str>$3, <str>$4, <str>$5, <str>$6, <str>$7, <str>$8, NOW()
      )
      RETURNING id, name, email
    `, [
      name, 
      description || null, 
      email, 
      website || null, 
      phone || null, 
      address || null, 
      type || 'convention_organizer', 
      status || 'active'
    ]);

    // Add admin user as association member
    await client.query(`
      INSERT INTO association_members (
        association_id, 
        profile_id, 
        role, 
        joined_at
      ) VALUES (
        <str>$1, <str>$2, <str>$3, NOW()
      )
    `, [(association as any).id, adminUserId, 'admin']);

    return NextResponse.json({
      success: true,
      associationId: (association as any).id,
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

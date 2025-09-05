import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'gel';

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json();

    if (!connectionString) {
      return NextResponse.json({ error: 'Connection string is required' }, { status: 400 });
    }

    // Test database connection
    const client = createClient(connectionString);
    
    // Try to execute a simple query
    await client.querySingle('SELECT 1 as test');
    
    // Test if we can create tables (check permissions)
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS setup_test (
          id SERIAL PRIMARY KEY,
          test_value TEXT
        )
      `);
      
      // Clean up test table
      await client.query('DROP TABLE IF EXISTS setup_test');
    } catch (error) {
      return NextResponse.json({ 
        error: 'Database connection successful but insufficient permissions to create tables' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database connection successful' 
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to database. Please check your connection string.' },
      { status: 400 }
    );
  }
}

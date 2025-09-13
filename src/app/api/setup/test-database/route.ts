import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  let client: Client | null = null;
  try {
    const { connectionString } = await request.json();

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Test database connection
    client = new Client({ connectionString });
    await client.connect();

    // Try to execute a simple query
    await client.query('SELECT 1 as test');

    // Test if we can create tables (check permissions) using a TEMP table
    try {
      await client.query(
        'CREATE TEMP TABLE setup_test (id integer PRIMARY KEY, test_value text)'
      );
      // Clean up temp table
      await client.query('DROP TABLE IF EXISTS setup_test');
    } catch {
      return NextResponse.json(
        {
          error:
            'Database connection successful but insufficient permissions to create tables',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        error:
          'Failed to connect to database. Please check your connection string.',
      },
      { status: 400 }
    );
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }
}

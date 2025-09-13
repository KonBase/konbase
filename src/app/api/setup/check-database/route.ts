import { NextResponse } from 'next/server';
import { getPostgresConnectionInfo } from '@/lib/db/postgres';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function GET() {
  const dataAccess = createDataAccessLayer();
  try {
    const connectionInfo = getPostgresConnectionInfo();
    const connectionType = 'postgresql';

    // Test the connection
    const startTime = Date.now();

    // Simple query to test connection
    await dataAccess.executeQuerySingle('SELECT 1 as test');

    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      connection: {
        type: connectionType,
        info: connectionInfo,
        latency: `${latency}ms`,
        status: 'connected',
      },
      message: `Database connected successfully via ${connectionType}`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection check failed:', error);

    return NextResponse.json(
      {
        success: false,
        connection: {
          type: 'postgresql',
          info: getPostgresConnectionInfo(),
          status: 'disconnected',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to database',
      },
      { status: 500 }
    );
  }
}

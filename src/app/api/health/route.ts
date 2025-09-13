import { NextResponse } from 'next/server';
import { getDataAccess } from '@/lib/db/data-access';

export async function GET() {
  try {
    const dataAccess = getDataAccess();
    const healthCheck = await dataAccess.healthCheck();

    return NextResponse.json({
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
      services: {
        database:
          healthCheck.status === 'healthy' ? 'connected' : 'disconnected',
        application: 'running',
        databaseType: dataAccess.getAdapterType(),
      },
      latency: healthCheck.latency,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          application: 'running',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getGelClient, getConnectionInfo, getConnectionType } from '@/lib/db/gel';

export async function GET(request: NextRequest) {
  try {
    const connectionInfo = getConnectionInfo();
    const connectionType = getConnectionType();
    
    // Test the connection
    const client = getGelClient();
    const startTime = Date.now();
    
    // Simple query to test connection
    await client.querySingle('SELECT 1 as test');
    
    const latency = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      connection: {
        type: connectionType,
        info: connectionInfo,
        latency: `${latency}ms`,
        status: 'connected'
      },
      message: `Database connected successfully via ${connectionType}`
    });
  } catch (error) {
    console.error('Database connection check failed:', error);
    
    return NextResponse.json({
      success: false,
      connection: {
        type: getConnectionType(),
        info: getConnectionInfo(),
        status: 'disconnected'
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to database'
    }, { status: 500 });
  }
}

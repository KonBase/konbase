import { NextRequest, NextResponse } from 'next/server';
import { getEdgeConfigDatabase, isEdgeConfigConfigured } from '@/lib/db/edge-config';

export async function GET(request: NextRequest) {
  try {
    // Check if Edge Config is configured
    const isConfigured = await isEdgeConfigConfigured();
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Edge Config is not configured. Please set EDGE_CONFIG_ID environment variable.',
        recommendations: [
          'Create an Edge Config in your Vercel dashboard',
          'Set the EDGE_CONFIG_ID environment variable',
          'Ensure your Edge Config has read access token configured'
        ]
      });
    }

    // Test Edge Config connectivity
    const db = getEdgeConfigDatabase();
    const healthCheck = await db.healthCheck();
    
    if (healthCheck.status === 'unhealthy') {
      return NextResponse.json({
        success: false,
        configured: true,
        message: 'Edge Config is configured but not accessible',
        recommendations: [
          'Check your Edge Config read access token',
          'Verify the Edge Config ID is correct',
          'Ensure your Edge Config is not empty'
        ]
      });
    }

    // Try to get system configuration to test data access
    const systemConfig = await db.getSystemConfig();
    
    return NextResponse.json({
      success: true,
      configured: true,
      message: 'Edge Config is properly configured and accessible',
      latency: healthCheck.latency,
      hasData: !!systemConfig,
      recommendations: [
        'Edge Config is ready for use',
        'Consider migrating your data to Edge Config for optimal performance',
        'Edge Config provides ultra-low latency data access (< 15ms)'
      ]
    });

  } catch (error) {
    console.error('Edge Config check failed:', error);
    
    return NextResponse.json({
      success: false,
      configured: false,
      message: 'Failed to check Edge Config configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [
        'Check your environment variables',
        'Verify Edge Config setup in Vercel dashboard',
        'Ensure proper permissions and tokens'
      ]
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'test-connection') {
      const db = getEdgeConfigDatabase();
      const healthCheck = await db.healthCheck();
      
      return NextResponse.json({
        success: healthCheck.status === 'healthy',
        latency: healthCheck.latency,
        status: healthCheck.status
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Test connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

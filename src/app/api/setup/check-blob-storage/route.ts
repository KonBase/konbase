import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedStorage } from '@/lib/storage/unified';
import { isVercelBlobConfigured } from '@/lib/storage/blob';

export async function GET(request: NextRequest) {
  try {
    const storage = getUnifiedStorage();
    const healthCheck = await storage.healthCheck();
    const isConfigured = isVercelBlobConfigured();
    const storageType = storage.getStorageType();

    // Test storage with a small operation
    let testResult = false;
    try {
      await storage.listFiles({ limit: 1 });
      testResult = true;
    } catch (error) {
      console.error('Storage test failed:', error);
    }

    const response = {
      success: healthCheck.status === 'healthy' && testResult,
      configured: isConfigured || storageType === 'local',
      storageType,
      health: healthCheck,
      message: healthCheck.status === 'healthy' 
        ? `${storageType === 'vercel-blob' ? 'Vercel Blob' : 'Local'} storage is properly configured and accessible`
        : `${storageType === 'vercel-blob' ? 'Vercel Blob' : 'Local'} storage is not accessible`,
      latency: healthCheck.latency,
      hasData: testResult,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking blob storage:', error);
    return NextResponse.json({
      success: false,
      configured: false,
      storageType: 'unknown',
      health: { status: 'unhealthy' },
      message: 'Failed to check storage configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

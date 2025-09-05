import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedDatabase } from '@/lib/db/unified';
import { isRedisConfigured } from '@/lib/db/redis';

export async function GET(request: NextRequest) {
  try {
    const db = getUnifiedDatabase();
    const adapterType = db.getAdapterType();
    
    // Check if database is available
    const isAvailable = await db.isAvailable();
    
    if (!isAvailable) {
      return NextResponse.json({
        setupComplete: false,
        databaseType: adapterType,
        error: `${adapterType} database is not available`
      });
    }

    // Check if setup is complete by looking for system settings
    const setupComplete = await db.get('system_settings:setup_complete');
    
    // Check if there are any users (indicates setup has been done)
    const users = await db.getAll('users');
    const userCount = users.length;
    
    // Check if there are any associations
    const associations = await db.getAll('associations');
    const associationCount = associations.length;

    const isSetupComplete = setupComplete === 'true' || 
                            (userCount > 0 && associationCount > 0);

    return NextResponse.json({
      setupComplete: isSetupComplete,
      databaseType: adapterType,
      userCount,
      associationCount,
      databaseAvailable: true,
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    
    // Check if Redis is configured as fallback
    const redisConfigured = isRedisConfigured();
    
    return NextResponse.json({
      setupComplete: false,
      databaseType: redisConfigured ? 'redis' : 'postgresql',
      databaseAvailable: false,
      error: 'Database connection failed'
    });
  }
}

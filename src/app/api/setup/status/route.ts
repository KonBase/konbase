import { NextRequest, NextResponse } from 'next/server';
import { geldb } from '@/lib/db/gel';

export async function GET(request: NextRequest) {
  try {
    // Check if setup is complete by looking for system settings
    const setupComplete = await geldb.querySingle(`
      SELECT value FROM system_settings WHERE key = 'setup_complete'
    `);

    // Check if there are any users (indicates setup has been done)
    const userCount = await geldb.querySingle(`
      SELECT COUNT(*) as count FROM users
    `) as any;

    // Check if there are any associations
    const associationCount = await geldb.querySingle(`
      SELECT COUNT(*) as count FROM associations
    `) as any;

    const isSetupComplete = (setupComplete as any)?.value === 'true' || 
                            ((userCount as any)?.count > 0 && (associationCount as any)?.count > 0);

    return NextResponse.json({
      setupComplete: isSetupComplete,
      userCount: (userCount as any)?.count || 0,
      associationCount: (associationCount as any)?.count || 0,
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    // If we can't connect to database, assume setup is needed
    return NextResponse.json({
      setupComplete: false,
      error: 'Database connection failed'
    });
  }
}

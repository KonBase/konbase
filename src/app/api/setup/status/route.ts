import { NextResponse } from 'next/server';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function GET() {
  try {
    // Check if PostgreSQL is configured
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      return NextResponse.json({
        setupComplete: false,
        databaseType: 'postgresql',
        databaseAvailable: false,
        error: 'PostgreSQL database configuration not found',
      });
    }

    const dataAccess = createDataAccessLayer('postgresql');

    // Check if database is available
    const healthCheck = await dataAccess.healthCheck();

    if (healthCheck.status !== 'healthy') {
      return NextResponse.json({
        setupComplete: false,
        databaseType: 'postgresql',
        databaseAvailable: false,
        error: 'PostgreSQL database is not available',
      });
    }

    // Check if setup is complete by looking for system settings
    const setupComplete = await dataAccess.getSystemSetting('setup_complete');

    // Check if there are any users (indicates setup has been done)
    const users = await dataAccess.executeQuery(
      'SELECT COUNT(*) as count FROM users'
    );
    const userCount = (users[0] as { count: number })?.count || 0;

    // Check if there are any associations
    const associations = await dataAccess.executeQuery(
      'SELECT COUNT(*) as count FROM associations'
    );
    const associationCount = (associations[0] as { count: number })?.count || 0;

    const isSetupComplete =
      setupComplete === 'true' || (userCount > 0 && associationCount > 0);

    return NextResponse.json({
      setupComplete: isSetupComplete,
      databaseType: 'postgresql',
      userCount,
      associationCount,
      databaseAvailable: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Setup status check error:', error);

    return NextResponse.json({
      setupComplete: false,
      databaseType: 'postgresql',
      databaseAvailable: false,
      error: 'Database connection failed',
    });
  }
}

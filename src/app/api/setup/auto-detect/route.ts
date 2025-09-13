import { NextResponse } from 'next/server';
import { getRedisConnectionInfo } from '@/lib/db/redis';
import { createDataAccessLayer } from '@/lib/db/data-access';
import { getPostgresConnectionInfo } from '@/lib/db/postgres';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dataAccess = createDataAccessLayer();
  try {
    const detection = {
      database: {
        configured: false,
        type: null as string | null,
        status: 'not_configured',
        details: null as Record<string, unknown> | null,
      },
      storage: {
        configured: false,
        type: null as string | null,
        status: 'not_configured',
        details: null as Record<string, unknown> | null,
      },
      migrations: {
        configured: false,
        status: 'unknown',
        pendingCount: 0,
        totalCount: 0,
        details: null as Record<string, unknown> | null,
      },
      setup: {
        canProceed: false,
        nextStep: 'database' as string,
        message: 'Please configure database and storage',
      },
    };

    // Detect database configuration
    const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const redisUrl = process.env.REDIS_URL;

    if (postgresUrl) {
      detection.database.configured = true;
      detection.database.type = 'postgresql';
      detection.database.status = 'configured';
      detection.database.details = getPostgresConnectionInfo();
    } else if (redisUrl) {
      detection.database.configured = true;
      detection.database.type = 'redis';
      detection.database.status = 'configured';
      detection.database.details = getRedisConnectionInfo();
    }

    // Detect storage configuration
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const storageType = process.env.STORAGE_TYPE;

    if (blobToken) {
      detection.storage.configured = true;
      detection.storage.type = 'vercel-blob';
      detection.storage.status = 'configured';
      detection.storage.details = {
        hasToken: !!blobToken,
        type: 'vercel-blob',
      };
    } else if (storageType === 'local') {
      detection.storage.configured = true;
      detection.storage.type = 'local';
      detection.storage.status = 'configured';
      detection.storage.details = {
        type: 'local',
        path: process.env.LOCAL_STORAGE_PATH || './uploads',
      };
    }

    // Detect migration status if database is configured
    if (detection.database.configured && detection.database.type !== 'redis') {
      try {
        const migrationsDir = path.join(
          process.cwd(),
          'scripts',
          'gel',
          'migrations'
        );

        if (fs.existsSync(migrationsDir)) {
          const files = fs
            .readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

          detection.migrations.configured = true;
          detection.migrations.totalCount = files.length;

          // Try to check applied migrations
          try {
            const appliedMigrations = (await dataAccess.executeQuery(`
              SELECT version FROM schema_migrations ORDER BY version
            `)) as { version: string }[];

            const appliedVersions = appliedMigrations.map(
              (m: { version: string }) => m.version
            );
            const pendingMigrations = files.filter(
              file => !appliedVersions.includes(file)
            );

            detection.migrations.pendingCount = pendingMigrations.length;
            detection.migrations.status =
              pendingMigrations.length === 0 ? 'up_to_date' : 'pending';
            detection.migrations.details = {
              appliedVersions,
              pendingVersions: pendingMigrations,
              migrationFiles: files,
            };
          } catch {
            // If we can't check migrations, assume they need to be run
            detection.migrations.status = 'unknown';
            detection.migrations.pendingCount = files.length;
            detection.migrations.details = {
              error: 'Could not check migration status',
              migrationFiles: files,
            };
          }
        }
      } catch {
        // eslint-disable-next-line no-console
        console.error('Migration detection error');
        detection.migrations.status = 'error';
        detection.migrations.details = {
          error: 'Unknown error',
        };
      }
    }

    // Determine if setup can proceed
    if (detection.database.configured && detection.storage.configured) {
      // Check if migrations are needed
      if (
        detection.migrations.configured &&
        detection.migrations.pendingCount > 0
      ) {
        detection.setup.canProceed = false;
        detection.setup.nextStep = 'migrations';
        detection.setup.message = `Database and storage configured, but ${detection.migrations.pendingCount} migrations are pending`;
      } else {
        detection.setup.canProceed = true;
        detection.setup.nextStep = 'admin';
        detection.setup.message = 'Ready to create admin user';
      }
    } else if (detection.database.configured) {
      detection.setup.nextStep = 'storage';
      detection.setup.message = 'Database configured, please configure storage';
    } else {
      detection.setup.nextStep = 'database';
      detection.setup.message = 'Please configure database first';
    }

    return NextResponse.json({
      success: true,
      detection,
      message: 'Environment detection completed',
    });
  } catch {
    // eslint-disable-next-line no-console
    console.error('Auto-detect error');
    return NextResponse.json(
      {
        success: false,
        error: 'Unknown error',
        message: 'Failed to detect environment configuration',
      },
      { status: 500 }
    );
  }
}

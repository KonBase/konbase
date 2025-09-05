import { NextRequest, NextResponse } from 'next/server';
import { getGelClient } from '@/lib/db/gel';
import fs from 'fs';
import path from 'path';

// Set timeout for the entire operation
const TIMEOUT_MS = 60000; // 60 seconds for migrations

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Migration timeout')), TIMEOUT_MS);
  });

  try {
    const operationPromise = async () => {
      console.log('Starting database migration...');

      // Check if we have a database connection
      const edgedbInstance = process.env.EDGEDB_INSTANCE;
      const edgedbSecretKey = process.env.EDGEDB_SECRET_KEY;
      const gelDatabaseUrl = process.env.GEL_DATABASE_URL;

      if (!edgedbInstance && !edgedbSecretKey && !gelDatabaseUrl) {
        return NextResponse.json({ 
          error: 'No database configuration found',
          suggestion: 'Please configure EDGEDB_INSTANCE + EDGEDB_SECRET_KEY or GEL_DATABASE_URL'
        }, { status: 400 });
      }

      // Get GelDB client
      const client = getGelClient();
      console.log('Database client initialized');

      // Read migration files
      const migrationsDir = path.join(process.cwd(), 'scripts', 'gel', 'migrations');
      
      if (!fs.existsSync(migrationsDir)) {
        return NextResponse.json({ 
          error: 'Migrations directory not found',
          suggestion: 'Ensure migration files exist in scripts/gel/migrations/'
        }, { status: 400 });
      }

      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
      
      console.log('Found migration files:', files);

      if (files.length === 0) {
        return NextResponse.json({ 
          success: true,
          message: 'No migrations to run',
          migrationsApplied: 0
        });
      }

      // Create migrations tracking table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Get already applied migrations
      const appliedMigrations = await client.query(`
        SELECT version FROM schema_migrations ORDER BY version
      `);
      
      const appliedVersions = appliedMigrations.map((m: any) => m.version);
      console.log('Already applied migrations:', appliedVersions);

      // Filter out already applied migrations
      const pendingMigrations = files.filter(file => !appliedVersions.includes(file));
      console.log('Pending migrations:', pendingMigrations);

      if (pendingMigrations.length === 0) {
        return NextResponse.json({ 
          success: true,
          message: 'All migrations already applied',
          migrationsApplied: 0,
          totalMigrations: files.length
        });
      }

      const results: Array<{
        file: string;
        status: 'success' | 'failed' | 'skipped' | 'pending';
        message: string;
      }> = [];
      let successCount = 0;

      // Apply each pending migration
      for (const file of pendingMigrations) {
        try {
          console.log(`Applying migration: ${file}`);
          
          const migrationPath = path.join(migrationsDir, file);
          const sql = fs.readFileSync(migrationPath, 'utf8');
          
          // Start transaction
          await client.query('BEGIN');
          
          try {
            // Execute migration SQL
            await client.query(sql);
            
            // Record migration as applied
            await client.query(`
              INSERT INTO schema_migrations (version) VALUES (<str>$1)
            `, [file]);
            
            // Commit transaction
            await client.query('COMMIT');
            
            results.push({
              file,
              status: 'success',
              message: 'Migration applied successfully'
            });
            successCount++;
            
            console.log(`Successfully applied migration: ${file}`);
            
          } catch (migrationError) {
            // Rollback transaction
            await client.query('ROLLBACK');
            
            const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
            
            // Check if it's a "already exists" error (safe to skip)
            if (/already exists|duplicate_object|relation.*already exists/i.test(errorMessage)) {
              console.warn(`Skipping ${file}: objects already exist`);
              
              // Still record it as applied since the objects exist
              await client.query('BEGIN');
              await client.query(`
                INSERT INTO schema_migrations (version) VALUES (<str>$1)
                ON CONFLICT (version) DO NOTHING
              `, [file]);
              await client.query('COMMIT');
              
              results.push({
                file,
                status: 'skipped',
                message: 'Objects already exist, migration skipped'
              });
              successCount++;
            } else {
              throw migrationError;
            }
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to apply migration ${file}:`, errorMessage);
          
          results.push({
            file,
            status: 'failed',
            message: errorMessage
          });
        }
      }

      console.log(`Migration process completed. ${successCount}/${pendingMigrations.length} migrations applied successfully`);

      return NextResponse.json({
        success: successCount > 0,
        message: `Applied ${successCount} of ${pendingMigrations.length} pending migrations`,
        migrationsApplied: successCount,
        totalMigrations: files.length,
        results,
        appliedMigrations: appliedVersions,
        pendingMigrations: pendingMigrations.filter((_, i) => results[i]?.status === 'pending')
      });
    };

    // Race between operation and timeout
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return result as NextResponse;

  } catch (error) {
    console.error('Migration error:', error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Migration timeout') {
      return NextResponse.json(
        { 
          error: 'Migration timeout - operation took too long',
          suggestion: 'Please check your database connection and try again'
        },
        { status: 504 }
      );
    }
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Database connection failed during migration',
            details: error.message,
            suggestion: 'Please check your database configuration and ensure the database is accessible'
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to run database migrations', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET(request: NextRequest) {
  try {
    console.log('Checking migration status...');

    // Check if we have a database connection
    const edgedbInstance = process.env.EDGEDB_INSTANCE;
    const edgedbSecretKey = process.env.EDGEDB_SECRET_KEY;
    const gelDatabaseUrl = process.env.GEL_DATABASE_URL;

    if (!edgedbInstance && !edgedbSecretKey && !gelDatabaseUrl) {
      return NextResponse.json({ 
        error: 'No database configuration found',
        suggestion: 'Please configure EDGEDB_INSTANCE + EDGEDB_SECRET_KEY or GEL_DATABASE_URL'
      }, { status: 400 });
    }

    // Get GelDB client
    const client = getGelClient();
    console.log('Database client initialized');

    // Read migration files
    const migrationsDir = path.join(process.cwd(), 'scripts', 'gel', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      return NextResponse.json({ 
        error: 'Migrations directory not found',
        suggestion: 'Ensure migration files exist in scripts/gel/migrations/'
      }, { status: 400 });
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log('Found migration files:', files);

    // Get already applied migrations
    let appliedMigrations = [];
    try {
      const result = await client.query(`
        SELECT version FROM schema_migrations ORDER BY version
      `);
      appliedMigrations = result.map((m: any) => m.version);
    } catch (error) {
      // If schema_migrations table doesn't exist, no migrations have been applied
      console.log('No migrations table found, assuming no migrations applied');
    }

    const pendingMigrations = files.filter(file => !appliedMigrations.includes(file));

    return NextResponse.json({
      success: true,
      totalMigrations: files.length,
      appliedMigrations: appliedMigrations.length,
      pendingMigrations: pendingMigrations.length,
      migrationFiles: files,
      appliedVersions: appliedMigrations,
      pendingVersions: pendingMigrations,
      isUpToDate: pendingMigrations.length === 0
    });

  } catch (error) {
    console.error('Migration status check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check migration status', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again'
      },
      { status: 500 }
    );
  }
}

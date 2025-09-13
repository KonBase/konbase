#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Starting Vercel build process...');

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.VERCEL_ENV === 'production';

console.log(`Environment: ${isVercel ? 'Vercel' : 'Local'}`);
console.log(`Deployment: ${isProduction ? 'Production' : 'Preview'}`);

// Check for database configuration
const hasEdgeDB = process.env.EDGEDB_INSTANCE && process.env.EDGEDB_SECRET_KEY;
const hasGelDB = process.env.GEL_DATABASE_URL;
const hasRedis = process.env.REDIS_URL;

console.log('Database configuration:');
console.log(`- EdgeDB: ${hasEdgeDB ? '✅ Configured' : '❌ Not configured'}`);
console.log(
  `- GelDB/PostgreSQL: ${hasGelDB ? '✅ Configured' : '❌ Not configured'}`
);
console.log(`- Redis: ${hasRedis ? '✅ Configured' : '❌ Not configured'}`);

if (!hasEdgeDB && !hasGelDB && !hasRedis) {
  console.log('⚠️  No database configuration found. Skipping migrations.');
  console.log('Build will continue without database setup.');
} else {
  console.log('📊 Database configuration found. Running migrations...');

  try {
    // Run migrations using the migration script
    console.log('Running database migrations...');
    execSync('node ./scripts/run-gel-migrations.mjs', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migrations failed:', error.message);

    // In Vercel, we don't want to fail the build if migrations fail
    // The app should still deploy and migrations can be run manually
    if (isVercel) {
      console.log(
        '⚠️  Continuing build despite migration failure (Vercel environment)'
      );
      console.log('💡 Run migrations manually after deployment if needed');
    } else {
      console.error('❌ Build failed due to migration errors');
      process.exit(1);
    }
  }
}

// Run Next.js build
console.log('🏗️  Building Next.js application...');
try {
  execSync('next build', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ Next.js build completed successfully');
} catch (error) {
  console.error('❌ Next.js build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Vercel build process completed successfully!');

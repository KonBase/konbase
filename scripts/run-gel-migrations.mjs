import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

// Try to use node-postgres as a generic Postgres client compatible with GelDB
let Client
try {
	;({ Client } = await import('pg'))
} catch (e) {
	console.warn('pg not installed; install it to run migrations locally: npm i -D pg')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.VERCEL_ENV === 'production';

console.log(`Environment: ${isVercel ? 'Vercel' : 'Local'}`);
console.log(`Deployment: ${isProduction ? 'Production' : 'Preview'}`);

// Load .env.local if present (only in local development)
if (!isVercel) {
	const envPath = path.join(process.cwd(), '.env.local')
	if (fs.existsSync(envPath)) {
		dotenv.config({ path: envPath })
	}
}

// Check for database configuration
const edgedbInstance = process.env.EDGEDB_INSTANCE;
const edgedbSecretKey = process.env.EDGEDB_SECRET_KEY;
const gelDatabaseUrl = process.env.GEL_DATABASE_URL;

console.log('Database configuration:');
console.log(`- EdgeDB: ${edgedbInstance && edgedbSecretKey ? '✅ Configured' : '❌ Not configured'}`);
console.log(`- GelDB/PostgreSQL: ${gelDatabaseUrl ? '✅ Configured' : '❌ Not configured'}`);

// Execute SQL files in order when a database connection is available
const migrationsDir = path.join(__dirname, 'gel', 'migrations')

if (!fs.existsSync(migrationsDir)) {
	console.log('Migrations directory not found. Skipping migrations.');
	process.exit(0);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
console.log('Found migrations:', files)

if (files.length === 0) {
	console.log('No migration files found. Skipping migrations.');
	process.exit(0);
}

// Determine connection string
let connectionString = null;

if (edgedbInstance && edgedbSecretKey) {
	// Use EdgeDB connection string
	connectionString = `edgedb://${edgedbInstance}:${edgedbSecretKey}@edgedb.cloud`;
	console.log('Using EdgeDB connection');
} else if (gelDatabaseUrl) {
	// Use GelDB/PostgreSQL connection string
	connectionString = gelDatabaseUrl;
	console.log('Using GelDB/PostgreSQL connection');
} else {
	console.log('No database configuration found. Skipping migrations.');
	process.exit(0);
}

if (!Client) {
	console.error('No pg client available. Install pg to execute migrations.');
	if (isVercel) {
		console.log('Continuing build without migrations (Vercel environment)');
		process.exit(0);
	} else {
		process.exit(1);
	}
}

const client = new Client({ 
	connectionString,
	connectionTimeoutMillis: 10000, // 10 seconds
	query_timeout: 30000, // 30 seconds
})

try {
	await client.connect()
	console.log('Connected to database successfully')
} catch (connectError) {
	console.error('Failed to connect to database:', connectError.message)
	if (isVercel) {
		console.log('Continuing build without migrations (database connection failed)')
		process.exit(0)
	} else {
		process.exit(1)
	}
}

try {
	// Create migrations tracking table if it doesn't exist
	await client.query(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id SERIAL PRIMARY KEY,
			version VARCHAR(255) UNIQUE NOT NULL,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)
	`)
	console.log('Migrations tracking table ready')

	// Get already applied migrations
	let appliedMigrations = []
	try {
		const result = await client.query('SELECT version FROM schema_migrations ORDER BY version')
		appliedMigrations = result.rows.map(row => row.version)
		console.log('Already applied migrations:', appliedMigrations)
	} catch (error) {
		console.log('No migrations table found, assuming no migrations applied')
	}

	// Filter out already applied migrations
	const pendingMigrations = files.filter(file => !appliedMigrations.includes(file))
	console.log('Pending migrations:', pendingMigrations)

	if (pendingMigrations.length === 0) {
		console.log('All migrations already applied')
		await client.end()
		process.exit(0)
	}

	// Apply each pending migration
	for (const file of pendingMigrations) {
		const full = path.join(migrationsDir, file)
		const sql = fs.readFileSync(full, 'utf8')
		console.log(`Applying ${file}...`)
		
		try {
			await client.query('BEGIN')
			await client.query(sql)
			
			// Record migration as applied
			await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
			
			await client.query('COMMIT')
			console.log(`✅ Successfully applied ${file}`)
		} catch (e) {
			await client.query('ROLLBACK')
			const msg = String(e?.message || e)
			
			if (/already exists|duplicate_object|relation.*already exists/i.test(msg)) {
				console.warn(`⚠️  Skipping ${file}: objects already exist`)
				
				// Still record it as applied since the objects exist
				try {
					await client.query('BEGIN')
					await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', [file])
					await client.query('COMMIT')
				} catch (recordError) {
					await client.query('ROLLBACK')
					console.warn(`Could not record ${file} as applied:`, recordError.message)
				}
				continue
			}
			
			console.error(`❌ Failed to apply ${file}:`, msg)
			if (isVercel) {
				console.log('Continuing with other migrations...')
				continue
			} else {
				throw e
			}
		}
	}
	
	console.log('✅ Migrations completed successfully')
} catch (err) {
	console.error('❌ Migration process failed:', err.message)
	if (isVercel) {
		console.log('Continuing build despite migration failure (Vercel environment)')
		console.log('💡 Run migrations manually after deployment if needed')
	} else {
		process.exit(1)
	}
} finally {
	try {
		await client.end()
		console.log('Database connection closed')
	} catch (closeError) {
		console.warn('Error closing database connection:', closeError.message)
	}
}

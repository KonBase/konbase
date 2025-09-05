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

// Load .env.local if present
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath })
}

// Execute SQL files in order when a GEL_DATABASE_URL is available
const migrationsDir = path.join(__dirname, 'gel', 'migrations')
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
console.log('Found migrations:', files)

const connectionString = process.env.GEL_DATABASE_URL || process.env.DATABASE_URL
if (!connectionString) {
	console.error('No GEL_DATABASE_URL provided. Skipping execution.')
	process.exit(0)
}

if (!Client) {
	console.error('No pg client available. Install pg to execute migrations.')
	process.exit(1)
}

const client = new Client({ connectionString })
await client.connect()
try {
	for (const file of files) {
		const full = path.join(migrationsDir, file)
		const sql = fs.readFileSync(full, 'utf8')
		console.log(`Applying ${file}...`)
		try {
			await client.query('BEGIN')
			await client.query(sql)
			await client.query('COMMIT')
		} catch (e) {
			await client.query('ROLLBACK')
			const msg = String(e?.message || e)
			if (/already exists|duplicate_object/i.test(msg)) {
				console.warn(`Skipping ${file}: objects already exist`)
				continue
			}
			throw e
		}
	}
	console.log('Migrations applied successfully')
} catch (err) {
	console.error('Migration failed:', err)
	process.exit(1)
} finally {
	await client.end()
}

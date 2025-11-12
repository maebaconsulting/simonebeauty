// Script to apply SQL migrations to Supabase using pg
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database connection config
const connectionString = 'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function applyMigration(client, filePath) {
  const migrationName = path.basename(filePath)
  console.log(`\n📦 Applying migration: ${migrationName}`)

  const sql = fs.readFileSync(filePath, 'utf-8')

  try {
    await client.query(sql)
    console.log(`✅ Successfully applied: ${migrationName}`)
    return true
  } catch (err) {
    console.error(`❌ Error applying ${migrationName}:`, err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n')

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')

    // Migrations to apply (in order)
    const migrations = [
      '20250108000000_create_client_addresses.sql',
      '20250108000001_create_booking_sessions.sql',
    ]

    let successCount = 0
    let failCount = 0

    for (const migration of migrations) {
      const filePath = path.join(migrationsDir, migration)

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Migration file not found: ${migration}`)
        failCount++
        continue
      }

      const success = await applyMigration(client, filePath)
      if (success) {
        successCount++
      } else {
        failCount++
        // Stop on first error
        break
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)

    await client.end()
    process.exit(failCount > 0 ? 1 : 0)
  } catch (err) {
    console.error('❌ Database connection error:', err.message)
    await client.end()
    process.exit(1)
  }
}

main()

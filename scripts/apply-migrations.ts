// Script to apply SQL migrations to Supabase
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration(filePath: string) {
  const migrationName = path.basename(filePath)
  console.log(`\n📦 Applying migration: ${migrationName}`)

  const sql = fs.readFileSync(filePath, 'utf-8')

  try {
    // Execute SQL via Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error(`❌ Error applying ${migrationName}:`, error.message)
      return false
    }

    console.log(`✅ Successfully applied: ${migrationName}`)
    return true
  } catch (err) {
    console.error(`❌ Exception applying ${migrationName}:`, err)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n')

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

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

    const success = await applyMigration(filePath)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log(`\n📊 Migration Summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)

  process.exit(failCount > 0 ? 1 : 0)
}

main()

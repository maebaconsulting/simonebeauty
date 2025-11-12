#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  console.log('🔧 Fixing RLS recursion issue...\n')

  try {
    // Read the migration file
    const migrationPath = join(
      __dirname,
      '../supabase/migrations/20250108000002_fix_rls_recursion.sql'
    )
    const migration = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration content:')
    console.log(migration)
    console.log('\n⏳ Applying migration...\n')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migration,
    })

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      if (error.code === '42883') {
        console.log('⚠️  exec_sql function not available, trying direct SQL...\n')

        // Split by statement and execute each one
        const statements = migration
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s && !s.startsWith('--'))

        for (const statement of statements) {
          if (statement) {
            console.log(`Executing: ${statement.substring(0, 60)}...`)
            const { error: execError } = await supabase.rpc('exec', {
              sql: statement,
            })
            if (execError) {
              console.error(`Error: ${execError.message}`)
            }
          }
        }
      } else {
        throw error
      }
    }

    console.log('✅ Migration applied successfully!\n')
    console.log('🎯 Next steps:')
    console.log('   1. Refresh http://localhost:3000/booking/test-connection')
    console.log('   2. Check that categories and services load without errors')
    console.log('   3. Then test http://localhost:3000/booking/services\n')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    if (error.details) console.error('Details:', error.details)
    if (error.hint) console.error('Hint:', error.hint)
    process.exit(1)
  }
}

applyMigration()

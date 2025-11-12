#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkTriggers() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('📋 Checking triggers on client_addresses...\n')

    const checkTriggers = await client.query(`
      SELECT
        trigger_name,
        event_manipulation,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'client_addresses'
      ORDER BY trigger_name;
    `)

    console.log('Triggers sur client_addresses :')
    console.table(checkTriggers.rows)

    // Get trigger function definitions
    if (checkTriggers.rows.length > 0) {
      console.log('\n📋 Détails des fonctions de trigger :\n')

      for (const trigger of checkTriggers.rows) {
        // Extract function name from action_statement
        const match = trigger.action_statement.match(/EXECUTE FUNCTION (\w+)\(\)/)
        if (match) {
          const functionName = match[1]
          console.log(`\n🔍 Fonction: ${functionName}\n`)

          const funcDef = await client.query(`
            SELECT pg_get_functiondef(oid) as definition
            FROM pg_proc
            WHERE proname = $1;
          `, [functionName])

          if (funcDef.rows.length > 0) {
            console.log(funcDef.rows[0].definition)
            console.log('\n' + '='.repeat(80) + '\n')
          }
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
    if (error.hint) console.error('Hint:', error.hint)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Database connection closed\n')
  }
}

checkTriggers()

#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkConstraintsPgCatalog() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('📋 Checking constraints via pg_catalog...\n')

    const checkConstraints = await client.query(`
      SELECT
        con.conname as constraint_name,
        con.contype as constraint_type,
        CASE con.contype
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'c' THEN 'CHECK'
          ELSE con.contype::text
        END as type_desc,
        pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = connamespace
      WHERE nsp.nspname = 'public'
        AND rel.relname = 'client_addresses';
    `)

    console.log('Contraintes sur client_addresses :')
    console.table(checkConstraints.rows)

    if (checkConstraints.rows.length === 0) {
      console.log('\n⚠️  Aucune contrainte trouvée sur client_addresses\n')
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

checkConstraintsPgCatalog()

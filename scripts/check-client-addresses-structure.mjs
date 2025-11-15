#!/usr/bin/env node

import pkg from 'pg'
const { Client } = pkg

const client = new Client({
  host: 'db.xpntvajwrjuvsqsmizzb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'MoutBinam@007',
  ssl: { rejectUnauthorized: false }
})

async function checkStructure() {
  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Get table structure
    const structureResult = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'client_addresses'
      ORDER BY ordinal_position
    `)

    console.log('\n📋 client_addresses table structure:')
    structureResult.rows.forEach(col => {
      const maxLength = col.character_maximum_length ? ` (max ${col.character_maximum_length})` : ''
      console.log(`  - ${col.column_name}: ${col.data_type}${maxLength} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkStructure()

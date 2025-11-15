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

async function checkProfilesStructure() {
  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Get table structure
    const structureResult = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `)

    console.log('\n📋 Profiles table structure:')
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    // Get some sample data
    const dataResult = await client.query(`
      SELECT * FROM profiles LIMIT 1
    `)

    if (dataResult.rows.length > 0) {
      console.log('\n📝 Sample profile:')
      console.log(dataResult.rows[0])
    } else {
      console.log('\n⚠️ No profiles found in database')
    }

    // Check auth.users to get user with email
    const authUsersResult = await client.query(`
      SELECT id, email FROM auth.users LIMIT 1
    `)

    if (authUsersResult.rows.length > 0) {
      console.log('\n👤 Sample auth user:')
      console.log(authUsersResult.rows[0])
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkProfilesStructure()

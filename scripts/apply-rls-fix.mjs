#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function fixRLSPolicies() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('🔧 Dropping problematic RLS policies...\n')

    // Drop the admin policies that cause infinite recursion
    const queries = [
      {
        name: 'Drop admin policy on services',
        sql: 'DROP POLICY IF EXISTS "Admins can manage services" ON services;',
      },
      {
        name: 'Drop admin policy on service_categories',
        sql: 'DROP POLICY IF EXISTS "Admins can manage categories" ON service_categories;',
      },
    ]

    for (const query of queries) {
      console.log(`⏳ ${query.name}...`)
      await client.query(query.sql)
      console.log(`✅ ${query.name} - Done\n`)
    }

    // Verify remaining policies
    console.log('📋 Checking remaining policies...\n')

    const checkPolicies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE tablename IN ('services', 'service_categories')
      ORDER BY tablename, policyname;
    `)

    console.log('Remaining RLS policies:')
    console.table(checkPolicies.rows)

    console.log('\n✅ RLS policies fixed successfully!\n')
    console.log('🎯 Next steps:')
    console.log('   1. Refresh http://localhost:3000/booking/test-connection')
    console.log('   2. Categories and services should now load without errors')
    console.log('   3. Then test http://localhost:3000/booking/services\n')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
    if (error.hint) console.error('Hint:', error.hint)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed\n')
  }
}

fixRLSPolicies()

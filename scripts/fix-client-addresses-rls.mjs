#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function fixClientAddressesRLS() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('🔧 Dropping problematic RLS policy on client_addresses...\n')

    // Drop the admin policy that causes infinite recursion
    console.log('⏳ Dropping "Admins can view all addresses" policy...')
    await client.query(`
      DROP POLICY IF EXISTS "Admins can view all addresses" ON client_addresses;
    `)
    console.log('✅ Policy dropped successfully!\n')

    // Verify remaining policies
    console.log('📋 Checking remaining policies on client_addresses...\n')

    const checkPolicies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE tablename = 'client_addresses'
      ORDER BY policyname;
    `)

    console.log('Remaining RLS policies on client_addresses:')
    console.table(checkPolicies.rows)

    console.log('\n✅ client_addresses RLS policies fixed successfully!\n')
    console.log('🎯 Next steps:')
    console.log('   1. Refresh http://localhost:3000/booking/address')
    console.log('   2. Click "+ Ajouter une nouvelle adresse"')
    console.log('   3. Fill in the form and submit')
    console.log('   4. Address should be created successfully\n')
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

fixClientAddressesRLS()

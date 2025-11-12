#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function fixBookingSessionsRLS() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('🔧 Dropping problematic RLS policy on booking_sessions...\n')

    // Drop the admin policy that causes infinite recursion
    console.log('⏳ Dropping "Admins can view all sessions" policy...')
    await client.query(`
      DROP POLICY IF EXISTS "Admins can view all sessions" ON booking_sessions;
    `)
    console.log('✅ Policy dropped successfully!\n')

    // Verify remaining policies
    console.log('📋 Checking remaining policies on booking_sessions...\n')

    const checkPolicies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE tablename = 'booking_sessions'
      ORDER BY policyname;
    `)

    console.log('Remaining RLS policies on booking_sessions:')
    console.table(checkPolicies.rows)

    console.log('\n✅ booking_sessions RLS policies fixed successfully!\n')
    console.log('🎯 Next steps:')
    console.log('   1. Refresh http://localhost:3000/booking/services')
    console.log('   2. Click on "Réserver" button')
    console.log('   3. Check console - session should be created successfully\n')
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

fixBookingSessionsRLS()

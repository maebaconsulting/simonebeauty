#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkClientAddressesPolicies() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('📋 Checking RLS policies on client_addresses...\n')

    const checkPolicies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual as using_expression,
        with_check as with_check_expression
      FROM pg_policies
      WHERE tablename = 'client_addresses'
      ORDER BY cmd, policyname;
    `)

    console.log('RLS Policies sur client_addresses :')
    console.table(checkPolicies.rows)

    // Check if RLS is enabled
    const checkRLS = await client.query(`
      SELECT
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE tablename = 'client_addresses'
        AND schemaname = 'public';
    `)

    console.log('\nStatut RLS :')
    console.table(checkRLS.rows)

    // Check for INSERT policies
    const insertPolicies = checkPolicies.rows.filter(p => p.cmd === 'INSERT')

    if (insertPolicies.length === 0) {
      console.log('\n❌ PROBLÈME : Aucune policy INSERT trouvée!')
      console.log('   Les utilisateurs ne peuvent pas créer d\'adresses.\n')
    } else {
      console.log(`\n✅ ${insertPolicies.length} policy(ies) INSERT trouvée(s)\n`)
    }

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

checkClientAddressesPolicies()

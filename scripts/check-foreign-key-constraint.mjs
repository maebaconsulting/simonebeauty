#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkForeignKeyConstraint() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('📋 Checking foreign key constraints on client_addresses...\n')

    const checkConstraints = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'client_addresses';
    `)

    console.log('Foreign Key Constraints :')
    console.table(checkConstraints.rows)

    // Check the actual data type and structure
    console.log('\n📋 Structure de la table client_addresses :\n')

    const tableStructure = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'client_addresses'
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    console.table(tableStructure.rows)

    // Check the profiles table structure
    console.log('\n📋 Structure de la table profiles (pour comparaison) :\n')

    const profilesStructure = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles'
        AND table_schema = 'public'
        AND column_name = 'id';
    `)

    console.table(profilesStructure.rows)

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

checkForeignKeyConstraint()

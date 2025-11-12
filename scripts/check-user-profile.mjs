#!/usr/bin/env node

import pg from 'pg'
const { Client } = pg

// Database connection from .env.local
const DATABASE_URL =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkUserProfiles() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    console.log('🔗 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('📋 Checking users and their profiles...\n')

    const checkUsers = await client.query(`
      SELECT
        au.id as auth_user_id,
        au.email,
        p.id as profile_id,
        p.role,
        p.first_name,
        p.last_name,
        CASE
          WHEN p.id IS NULL THEN '❌ PAS DE PROFIL'
          ELSE '✅ Profil existe'
        END as status
      FROM auth.users au
      LEFT JOIN profiles p ON p.id = au.id
      ORDER BY au.created_at DESC
      LIMIT 10;
    `)

    console.log('Utilisateurs et leurs profils :')
    console.table(checkUsers.rows)

    // Count users without profiles
    const missingProfiles = checkUsers.rows.filter(row => !row.profile_id)

    if (missingProfiles.length > 0) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ !')
      console.log(`   ${missingProfiles.length} utilisateur(s) n'ont pas de profil dans la table profiles`)
      console.log('\n   Ces utilisateurs ne peuvent pas créer d\'adresses car client_addresses')
      console.log('   a une contrainte de clé étrangère vers profiles.id\n')

      console.log('📝 Solution : Créer les profils manquants avec un trigger ou manuellement\n')
    } else {
      console.log('\n✅ Tous les utilisateurs ont un profil!\n')
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

checkUserProfiles()

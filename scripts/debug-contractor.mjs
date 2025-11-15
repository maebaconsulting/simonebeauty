#!/usr/bin/env node

/**
 * Script pour débugger la création de contractor
 */

import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres';

async function debugContractor() {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // 1. Vérifier la table contractors
    console.log('📋 1. Vérification de la table contractors:\n');
    const contractorsResult = await client.query(`
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        profile_uuid
      FROM contractors
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    if (contractorsResult.rows.length === 0) {
      console.log('❌ Aucun contractor trouvé dans la table contractors\n');
    } else {
      console.log(`✅ ${contractorsResult.rows.length} contractor(s) trouvé(s):\n`);
      contractorsResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.first_name} ${row.last_name} (${row.email})`);
        console.log(`     ID: ${row.id}, UUID: ${row.profile_uuid}`);
        console.log(`     Créé: ${row.created_at}\n`);
      });
    }

    // 2. Vérifier auth.users
    console.log('📋 2. Vérification de auth.users:\n');
    const usersResult = await client.query(`
      SELECT
        id,
        email,
        created_at,
        email_confirmed_at,
        last_sign_in_at
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    console.log(`✅ ${usersResult.rows.length} utilisateur(s) trouvé(s):\n`);
    usersResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.email}`);
      console.log(`     UUID: ${row.id}`);
      console.log(`     Email confirmé: ${row.email_confirmed_at ? 'Oui' : 'Non'}`);
      console.log(`     Dernière connexion: ${row.last_sign_in_at || 'Jamais'}\n`);
    });

    // 3. Vérifier les candidatures
    console.log('📋 3. Vérification des candidatures:\n');
    const applicationsResult = await client.query(`
      SELECT
        id,
        first_name,
        last_name,
        email,
        status,
        submitted_at
      FROM contractor_applications
      ORDER BY submitted_at DESC
      LIMIT 5;
    `);

    if (applicationsResult.rows.length === 0) {
      console.log('❌ Aucune candidature trouvée\n');
    } else {
      console.log(`✅ ${applicationsResult.rows.length} candidature(s) trouvée(s):\n`);
      applicationsResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.first_name} ${row.last_name} (${row.email})`);
        console.log(`     Status: ${row.status}`);
        console.log(`     Soumise: ${row.submitted_at}\n`);
      });
    }

    // 4. Vérifier contractor_profiles
    console.log('📋 4. Vérification de contractor_profiles:\n');
    const profilesResult = await client.query(`
      SELECT
        id,
        contractor_id,
        bio,
        professional_title,
        created_at
      FROM contractor_profiles
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    if (profilesResult.rows.length === 0) {
      console.log('❌ Aucun profil contractor trouvé\n');
    } else {
      console.log(`✅ ${profilesResult.rows.length} profil(s) trouvé(s):\n`);
      profilesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Contractor ID: ${row.contractor_id}`);
        console.log(`     Titre: ${row.professional_title || 'Non défini'}`);
        console.log(`     Créé: ${row.created_at}\n`);
      });
    }

    // 5. Vérifier contractor_onboarding_status
    console.log('📋 5. Vérification de contractor_onboarding_status:\n');
    const onboardingResult = await client.query(`
      SELECT
        id,
        contractor_id,
        is_completed,
        schedule_configured,
        stripe_connected,
        profile_completed,
        created_at
      FROM contractor_onboarding_status
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    if (onboardingResult.rows.length === 0) {
      console.log('❌ Aucun statut d\'onboarding trouvé\n');
    } else {
      console.log(`✅ ${onboardingResult.rows.length} statut(s) trouvé(s):\n`);
      onboardingResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Contractor ID: ${row.contractor_id}`);
        console.log(`     Complété: ${row.is_completed ? 'Oui' : 'Non'}`);
        console.log(`     Planning: ${row.schedule_configured ? '✓' : '✗'}`);
        console.log(`     Stripe: ${row.stripe_connected ? '✓' : '✗'}`);
        console.log(`     Profil: ${row.profile_completed ? '✓' : '✗'}\n`);
      });
    }

    // 6. Vérifier la correspondance entre contractors et auth.users
    console.log('📋 6. Vérification de la correspondance contractors <-> auth.users:\n');
    const matchResult = await client.query(`
      SELECT
        c.id as contractor_id,
        c.first_name,
        c.last_name,
        c.email as contractor_email,
        c.profile_uuid,
        u.id as user_uuid,
        u.email as user_email,
        CASE
          WHEN u.id IS NULL THEN '❌ Pas de compte auth.users'
          WHEN c.profile_uuid != u.id THEN '⚠️  UUID ne correspond pas'
          ELSE '✅ OK'
        END as status
      FROM contractors c
      LEFT JOIN auth.users u ON c.profile_uuid = u.id
      ORDER BY c.created_at DESC
      LIMIT 5;
    `);

    if (matchResult.rows.length === 0) {
      console.log('❌ Aucun contractor pour vérifier la correspondance\n');
    } else {
      matchResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.first_name} ${row.last_name}`);
        console.log(`     Email contractor: ${row.contractor_email}`);
        console.log(`     Email auth: ${row.user_email || 'N/A'}`);
        console.log(`     Status: ${row.status}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\nDétails:', error);
  } finally {
    await client.end();
  }
}

// Exécution
debugContractor();

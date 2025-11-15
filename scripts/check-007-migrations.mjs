#!/usr/bin/env node

/**
 * Script pour vérifier si les migrations 007 ont été appliquées
 */

import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres';

async function checkMigrations() {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données Supabase\n');

    // Vérifier les migrations appliquées
    console.log('📋 Vérification des migrations 007...\n');

    const migrationsQuery = `
      SELECT version, name
      FROM supabase_migrations.schema_migrations
      WHERE version LIKE '202501070%'
      ORDER BY version;
    `;

    const result = await client.query(migrationsQuery);

    if (result.rows.length === 0) {
      console.log('❌ AUCUNE migration 007 appliquée\n');
      console.log('📝 Il faut appliquer les 15 migrations (20250107000000 à 20250107000014)\n');
      return { applied: false, count: 0 };
    }

    console.log(`✅ ${result.rows.length} migration(s) 007 appliquée(s) :\n`);
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.version} - ${row.name || '(pas de nom)'}`);
    });

    console.log('');

    if (result.rows.length < 15) {
      console.log(`⚠️  Il manque ${15 - result.rows.length} migration(s)\n`);
      return { applied: 'partial', count: result.rows.length };
    }

    console.log('✅ Toutes les 15 migrations 007 sont appliquées !\n');

    // Vérifier quelques tables clés pour confirmer
    console.log('🔍 Vérification des tables créées...\n');

    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'specialties',
          'contractor_applications',
          'contractor_profiles',
          'contractor_services',
          'booking_requests'
        )
      ORDER BY table_name;
    `;

    const tablesResult = await client.query(tablesQuery);

    console.log('Tables trouvées :');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('');

    return { applied: true, count: result.rows.length, tables: tablesResult.rows.length };

  } catch (error) {
    console.error('❌ Erreur :', error.message);
    console.error('\nDétails :', error);
    return { error: true, message: error.message };
  } finally {
    await client.end();
  }
}

// Exécution
checkMigrations()
  .then(result => {
    if (result.error) {
      process.exit(1);
    }

    console.log('📊 Résumé :');
    console.log(`  - Migrations appliquées : ${result.count || 0}/15`);
    if (result.tables !== undefined) {
      console.log(`  - Tables vérifiées : ${result.tables}/5`);
    }
    console.log('');

    if (!result.applied || result.applied === 'partial') {
      console.log('🔧 Prochaine étape : Appliquer les migrations manquantes\n');
      process.exit(2); // Code spécial pour "migrations à appliquer"
    } else {
      console.log('✨ Base de données à jour !\n');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

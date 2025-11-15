#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres';

async function checkStructure() {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Connecté\n');

    // Vérifier la structure de contractors
    console.log('📋 Structure de la table contractors:\n');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contractors'
      ORDER BY ordinal_position;
    `);

    if (structureResult.rows.length === 0) {
      console.log('❌ La table contractors n\'existe pas !\n');
    } else {
      console.log('Colonnes :');
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    console.log('\n📋 Données dans contractors:\n');
    const dataResult = await client.query('SELECT * FROM contractors LIMIT 5;');

    if (dataResult.rows.length === 0) {
      console.log('❌ Aucun contractor dans la table\n');
    } else {
      console.log(`✅ ${dataResult.rows.length} contractor(s) trouvé(s):\n`);
      console.log(JSON.stringify(dataResult.rows, null, 2));
    }

    // Vérifier les candidatures
    console.log('\n📋 Candidatures:\n');
    const appsResult = await client.query('SELECT id, email, status FROM contractor_applications LIMIT 5;');

    if (appsResult.rows.length === 0) {
      console.log('❌ Aucune candidature\n');
    } else {
      console.log(`✅ ${appsResult.rows.length} candidature(s):\n`);
      appsResult.rows.forEach(row => {
        console.log(`  - ID ${row.id}: ${row.email} (${row.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkStructure();

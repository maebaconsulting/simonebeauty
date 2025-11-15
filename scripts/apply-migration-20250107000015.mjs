#!/usr/bin/env node

/**
 * Script pour appliquer uniquement la migration 20250107000015
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xpntvajwrjuvsqsmizzb.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbnR2YWp3cmp1dnNxc21penpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUyMDgwNywiZXhwIjoyMDc4MDk2ODA3fQ.-oT4IRZMvME-a7zcBLQcdATyH6YDhGVCxR6AjYcNkho';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('🚀 Application de la migration 20250107000015_update_contractor_applications.sql\n');

try {
  // Lire le fichier de migration
  const migrationPath = resolve(__dirname, '../supabase/migrations/20250107000015_update_contractor_applications.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration SQL chargée');
  console.log('📍 Fichier:', migrationPath);
  console.log('\n🔧 Exécution des commandes SQL...\n');

  // Exécuter le SQL
  const { error } = await supabase.rpc('exec_sql', { sql_string: migrationSQL });

  if (error) {
    console.error('❌ Erreur lors de l\'exécution:', error.message);

    // Try alternative approach: execute via PostgreSQL connection string
    console.log('\n🔄 Tentative alternative via connexion directe...\n');

    const connectionString = `postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres`;

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 ${statements.length} commandes SQL à exécuter\n`);

    // Execute each statement separately using the REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.startsWith('SELECT') || statement.startsWith('COMMENT')) {
        continue; // Skip SELECT and COMMENT statements
      }

      console.log(`⚙️  Exécution ${i + 1}/${statements.length}...`);

      try {
        const { error: stmtError } = await supabase.rpc('exec', {
          sql: statement + ';'
        });

        if (stmtError) {
          console.error(`   ❌ Erreur:`, stmtError.message);
        } else {
          console.log(`   ✅ OK`);
        }
      } catch (err) {
        console.error(`   ❌ Exception:`, err.message);
      }
    }

    process.exit(1);
  }

  console.log('✅ Migration appliquée avec succès!\n');

  // Vérifier les changements
  console.log('🔍 Vérification de la structure de la table...\n');

  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'contractor_applications')
    .order('ordinal_position');

  if (colError) {
    console.error('❌ Erreur de vérification:', colError.message);
  } else if (columns) {
    console.log('📋 Colonnes de contractor_applications:');
    columns.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }

  console.log('\n✨ Migration terminée!');

} catch (error) {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
}

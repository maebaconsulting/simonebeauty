#!/usr/bin/env node

/**
 * Script pour appliquer la migration 20250107000015
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://xpntvajwrjuvsqsmizzb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbnR2YWp3cmp1dnNxc21penpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUyMDgwNywiZXhwIjoyMDc4MDk2ODA3fQ.-oT4IRZMvME-a7zcBLQcdATyH6YDhGVCxR6AjYcNkho';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

console.log('🚀 Application de la migration 20250107000015\n');

// Lire le fichier de migration
const migrationPath = resolve(__dirname, '../supabase/migrations/20250107000015_update_contractor_applications.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

// Diviser en commandes individuelles
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

console.log(`📊 ${statements.length} commandes SQL à exécuter\n`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i].trim();

  // Skip comment-only statements
  if (!statement || statement.startsWith('--')) {
    continue;
  }

  const preview = statement.substring(0, 60).replace(/\n/g, ' ');
  console.log(`⚙️  [${i + 1}/${statements.length}] ${preview}...`);

  try {
    const { error } = await supabase.rpc('exec', {
      sql: statement + ';'
    });

    if (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      errorCount++;
    } else {
      console.log(`   ✅ OK`);
      successCount++;
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    errorCount++;
  }

  // Petit délai pour éviter la surcharge
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log(`\n📈 Résultat: ${successCount} succès, ${errorCount} erreurs\n`);

if (errorCount === 0) {
  console.log('✅ Migration appliquée avec succès!\n');

  // Vérifier la structure
  console.log('🔍 Vérification de la structure...\n');

  const { data, error } = await supabase
    .from('contractor_applications')
    .select('*')
    .limit(0);

  if (error) {
    console.log('⚠️  Impossible de vérifier (normal si table vide)');
  } else {
    console.log('✅ Table contractor_applications accessible');
  }
} else {
  console.error('❌ Des erreurs sont survenues lors de la migration');
  process.exit(1);
}

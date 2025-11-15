#!/usr/bin/env node

/**
 * Script to create Supabase Storage buckets for contractor interface
 * T016: job-applications bucket
 * T017: contractor-portfolios bucket
 */

import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres';

async function setupStorageBuckets() {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données Supabase\n');

    // Check if buckets already exist
    console.log('📋 Vérification des buckets existants...\n');

    const checkBucketsQuery = `
      SELECT id, name, public
      FROM storage.buckets
      WHERE id IN ('job-applications', 'contractor-portfolios')
      ORDER BY id;
    `;

    const existing = await client.query(checkBucketsQuery);

    if (existing.rows.length > 0) {
      console.log('📦 Buckets existants :');
      existing.rows.forEach(row => {
        console.log(`  - ${row.id} (public: ${row.public})`);
      });
      console.log('');
    }

    // Create job-applications bucket if not exists
    console.log('📦 T016: Configuration bucket "job-applications"...\n');

    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('job-applications', 'job-applications', false)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('  ✓ Bucket créé/vérifié\n');

    // Create RLS policies for job-applications
    console.log('  🔒 Configuration des RLS policies...\n');

    // Drop existing policies if they exist
    await client.query(`
      DROP POLICY IF EXISTS "Authenticated users can upload job application files"
      ON storage.objects;
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Admins can view all job application files"
      ON storage.objects;
    `);

    // Create INSERT policy
    await client.query(`
      CREATE POLICY "Authenticated users can upload job application files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'job-applications');
    `);

    console.log('  ✓ Policy INSERT créée (authenticated users can upload)\n');

    // Create SELECT policy
    await client.query(`
      CREATE POLICY "Admins can view all job application files"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'job-applications'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
    `);

    console.log('  ✓ Policy SELECT créée (admin read access)\n');

    // Create contractor-portfolios bucket
    console.log('📦 T017: Configuration bucket "contractor-portfolios"...\n');

    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('contractor-portfolios', 'contractor-portfolios', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('  ✓ Bucket créé/vérifié (public read)\n');

    // Create RLS policies for contractor-portfolios
    console.log('  🔒 Configuration des RLS policies...\n');

    // Drop existing policies if they exist
    await client.query(`
      DROP POLICY IF EXISTS "Contractors can upload portfolio files"
      ON storage.objects;
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Public can view contractor portfolios"
      ON storage.objects;
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Contractors can update their portfolio files"
      ON storage.objects;
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Contractors can delete their portfolio files"
      ON storage.objects;
    `);

    // Create INSERT policy (contractors can upload)
    await client.query(`
      CREATE POLICY "Contractors can upload portfolio files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'contractor-portfolios'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
    `);

    console.log('  ✓ Policy INSERT créée (contractors can upload to their folder)\n');

    // Create SELECT policy (public read)
    await client.query(`
      CREATE POLICY "Public can view contractor portfolios"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'contractor-portfolios');
    `);

    console.log('  ✓ Policy SELECT créée (public read access)\n');

    // Create UPDATE policy
    await client.query(`
      CREATE POLICY "Contractors can update their portfolio files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'contractor-portfolios'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
    `);

    console.log('  ✓ Policy UPDATE créée\n');

    // Create DELETE policy
    await client.query(`
      CREATE POLICY "Contractors can delete their portfolio files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'contractor-portfolios'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
    `);

    console.log('  ✓ Policy DELETE créée\n');

    // Verify final state
    console.log('📊 Vérification finale...\n');

    const finalCheck = await client.query(checkBucketsQuery);

    console.log('✅ Buckets configurés :');
    finalCheck.rows.forEach(row => {
      console.log(`  - ${row.id} (public: ${row.public})`);
    });
    console.log('');

    // Count policies
    const policiesQuery = `
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname LIKE '%job application%'
           OR policyname LIKE '%portfolio%';
    `;

    const policies = await client.query(policiesQuery);
    console.log(`✅ ${policies.rows[0].count} RLS policies configurées\n`);

    return { success: true };

  } catch (error) {
    console.error('❌ Erreur :', error.message);
    console.error('\nDétails :', error);
    return { error: true, message: error.message };
  } finally {
    await client.end();
  }
}

// Exécution
setupStorageBuckets()
  .then(result => {
    if (result.error) {
      console.error('\n❌ La configuration des buckets a échoué\n');
      process.exit(1);
    } else {
      console.log('✨ Configuration des Storage buckets terminée avec succès !\n');
      console.log('📝 Prochaines étapes :');
      console.log('  - T018: Configurer les variables Stripe Connect');
      console.log('  - T019: ✅ NEXT_PUBLIC_SITE_URL déjà configuré');
      console.log('  - T020: ✅ RESEND_API_KEY déjà configuré\n');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

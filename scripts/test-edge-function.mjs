#!/usr/bin/env node

/**
 * Script pour tester l'Edge Function submit-job-application
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire le fichier .env.local
let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si pas dans l'environnement, lire depuis .env.local
if (!SUPABASE_URL || !ANON_KEY) {
  try {
    const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
    const lines = envFile.split('\n');

    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        SUPABASE_URL = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        ANON_KEY = line.split('=')[1].trim();
      }
    }
  } catch (error) {
    console.error('❌ Impossible de lire .env.local:', error.message);
  }
}

console.log('🧪 Test de l\'Edge Function submit-job-application\n');

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL non défini dans .env.local');
  process.exit(1);
}

if (!ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY non défini dans .env.local');
  process.exit(1);
}

console.log('📍 URL Supabase:', SUPABASE_URL);
console.log('🔑 Anon Key:', ANON_KEY.substring(0, 20) + '...\n');

const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/submit-job-application`;
console.log('🎯 Edge Function URL:', edgeFunctionUrl, '\n');

// Préparer les données de test
const testData = {
  first_name: 'Jean',
  last_name: 'Test',
  email: 'test@example.com',
  phone: '+33612345678',
  address: '123 Test Street, Paris',
  profession: 'Coiffeur',
  years_of_experience: 5,
  diplomas: 'CAP Coiffure',
  specialties: [1, 2],
  services_offered: 'Coupe, Coloration',
  geographic_zones: ['Paris 1er', 'Paris 2e'],
  preferred_schedule: 'Matin',
  work_frequency: 'part_time',
  motivation: 'Je souhaite rejoindre Simone car votre plateforme représente exactement ce que je recherche : une opportunité de travailler de manière flexible tout en offrant un service de qualité à des clients exigeants. Mon expérience et ma passion pour mon métier me permettront de contribuer positivement à votre réseau.'
};

// Test 1: Vérifier que l'endpoint répond
console.log('📋 Test 1: Vérifier que l\'endpoint est accessible...\n');

try {
  const formData = new FormData();
  formData.append('data', JSON.stringify(testData));

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: formData,
  });

  console.log('📊 Status:', response.status, response.statusText);
  console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

  if (response.ok) {
    const result = await response.json();
    console.log('\n✅ Succès:', result);
  } else {
    const errorText = await response.text();
    console.error('\n❌ Erreur:', errorText);

    if (response.status === 404) {
      console.error('\n💡 L\'Edge Function n\'est probablement pas déployée.');
      console.error('   Déployez-la avec: supabase functions deploy submit-job-application');
    }
  }
} catch (error) {
  console.error('\n❌ Erreur de connexion:', error.message);

  if (error.message.includes('fetch failed')) {
    console.error('\n💡 Causes possibles:');
    console.error('   1. L\'Edge Function n\'est pas déployée');
    console.error('   2. L\'URL Supabase est incorrecte');
    console.error('   3. Problème de connexion réseau');
  }
}

console.log('\n---');
console.log('ℹ️  Pour déployer l\'Edge Function:');
console.log('   supabase login');
console.log('   supabase link --project-ref xpntvajwrjuvsqsmizzb');
console.log('   supabase functions deploy submit-job-application');

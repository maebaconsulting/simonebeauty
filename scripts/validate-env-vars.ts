#!/usr/bin/env ts-node
/**
 * Validate Environment Variables - Build Security Script
 *
 * Ensures all required environment variables are defined
 * Prevents runtime errors from missing configuration
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  variable: string;
  issue: string;
}

const errors: ValidationResult[] = [];
const warnings: ValidationResult[] = [];

// Required environment variables for the application
const REQUIRED_ENV_VARS = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key',

  // Stripe (can be placeholder in development)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key',
  STRIPE_SECRET_KEY: 'Stripe secret key',

  // Resend Email
  RESEND_API_KEY: 'Resend email service API key',
  RESEND_FROM_EMAIL: 'Resend sender email address',

  // Google Maps
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'Google Maps API key',
};

// Optional but recommended variables
const OPTIONAL_ENV_VARS = {
  TWILIO_ACCOUNT_SID: 'Twilio account SID (for SMS)',
  TWILIO_AUTH_TOKEN: 'Twilio auth token (for SMS)',
  TWILIO_PHONE_NUMBER: 'Twilio phone number (for SMS)',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  GOOGLE_MAPS_API_KEY: 'Google Maps API key (server-side)',
};

function validateEnvVars(): void {
  console.log('🔍 Validating Environment Variables...\n');

  // Check required variables
  for (const [varName, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];

    if (!value) {
      errors.push({
        variable: varName,
        issue: `Missing required variable: ${description}`,
      });
    } else if (value.startsWith('YOUR_') || value === 'placeholder') {
      errors.push({
        variable: varName,
        issue: `Placeholder value detected: ${description}`,
      });
    }
  }

  // Check optional variables
  for (const [varName, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[varName];

    if (!value) {
      warnings.push({
        variable: varName,
        issue: `Optional variable not set: ${description}`,
      });
    } else if (value.startsWith('YOUR_') || value === 'placeholder') {
      warnings.push({
        variable: varName,
        issue: `Placeholder value detected: ${description}`,
      });
    }
  }
}

function checkEnvExample(): void {
  const envExamplePath = join(process.cwd(), '.env.local.example');

  try {
    const envExample = readFileSync(envExamplePath, 'utf-8');
    const exampleVars = envExample
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=')[0].trim());

    // Check if all required vars are in example
    for (const varName of Object.keys(REQUIRED_ENV_VARS)) {
      if (!exampleVars.includes(varName)) {
        warnings.push({
          variable: varName,
          issue: `Not documented in .env.local.example`,
        });
      }
    }
  } catch (error) {
    warnings.push({
      variable: '.env.local.example',
      issue: 'File not found or unreadable',
    });
  }
}

function main(): void {
  validateEnvVars();
  checkEnvExample();

  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables are valid!\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.error('❌ Environment Variable Errors:\n');
    errors.forEach(({ variable, issue }) => {
      console.error(`  ${variable}`);
      console.error(`    └─ ${issue}\n`);
    });
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    warnings.forEach(({ variable, issue }) => {
      console.warn(`  ${variable}`);
      console.warn(`    └─ ${issue}\n`);
    });
  }

  if (errors.length > 0) {
    console.error('\n💡 Fix: Add missing variables to .env.local');
    console.error('   Copy from .env.local.example and fill in real values\n');
    process.exit(1);
  }

  process.exit(0);
}

main();

#!/usr/bin/env ts-node
/**
 * Validate Lazy Initialization - Build Security Script
 *
 * Ensures external SDKs (Stripe, Twilio, etc.) use lazy initialization
 * Prevents build-time errors when environment variables are not available
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  file: string;
  issue: string;
}

const errors: ValidationResult[] = [];
const warnings: ValidationResult[] = [];

// SDK patterns to check for dangerous initialization
const SDK_PATTERNS = [
  {
    name: 'Stripe',
    import: /import\s+Stripe\s+from\s+['"]stripe['"]/,
    dangerousInit: /const\s+stripe\s*=\s*new\s+Stripe\s*\(/,
    envVar: 'STRIPE_SECRET_KEY',
  },
  {
    name: 'Twilio',
    import: /import\s+twilio\s+from\s+['"]twilio['"]/,
    dangerousInit: /const\s+\w+\s*=\s*twilio\s*\(/,
    envVar: 'TWILIO_ACCOUNT_SID',
  },
  {
    name: 'OpenAI',
    import: /import\s+.*OpenAI.*from\s+['"]openai['"]/,
    dangerousInit: /const\s+\w+\s*=\s*new\s+OpenAI\s*\(/,
    envVar: 'OPENAI_API_KEY',
  },
  {
    name: 'Supabase Server',
    import: /import\s+.*createClient.*from\s+['"]@supabase\/supabase-js['"]/,
    dangerousInit: /const\s+supabase\s*=\s*createClient\s*\(/,
    envVar: 'SUPABASE_SERVICE_ROLE_KEY',
  },
];

function findLibFiles(dir: string, results: string[] = []): string[] {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip unnecessary directories
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findLibFiles(fullPath, results);
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore
  }

  return results;
}

function validateLazyInit(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');

  for (const sdk of SDK_PATTERNS) {
    // Check if file imports the SDK
    if (!sdk.import.test(content)) {
      continue; // Doesn't use this SDK
    }

    // Check for dangerous top-level initialization
    if (sdk.dangerousInit.test(content)) {
      // Check if it's actually inside a function or using Proxy pattern
      const hasGetterFunction = content.includes('function get') || content.includes('const get');
      const hasProxyPattern = content.includes('new Proxy(');
      const isInFunction = content.includes('export function') || content.includes('export const');

      if (!hasGetterFunction && !hasProxyPattern && !isInFunction) {
        errors.push({
          file: filePath.replace(process.cwd(), ''),
          issue: `${sdk.name} initialized at module load time (should use lazy initialization)`,
        });
      }
    }
  }

  // Check for direct env var access at module level (without lazy init)
  const topLevelEnvAccess = /^(?!.*function).*process\.env\./gm.test(content);
  if (topLevelEnvAccess && !content.includes('getServerSide') && !content.includes('Proxy')) {
    // This might be okay in some cases, so just warn
    const hasConfigExport = content.includes('export const config') || content.includes('export default {');
    if (!hasConfigExport) {
      warnings.push({
        file: filePath.replace(process.cwd(), ''),
        issue: 'Direct process.env access at module level (consider lazy initialization)',
      });
    }
  }
}

function main(): void {
  console.log('🔍 Validating Lazy Initialization Patterns...\n');

  const libDir = join(process.cwd(), 'lib');
  const appDir = join(process.cwd(), 'app', 'api');

  const files = [
    ...findLibFiles(libDir),
    ...findLibFiles(appDir),
  ];

  console.log(`Checking ${files.length} files\n`);

  for (const file of files) {
    validateLazyInit(file);
  }

  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All SDK initializations use lazy pattern!\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.error('❌ Lazy Initialization Errors:\n');
    errors.forEach(({ file, issue }) => {
      console.error(`  ${file}`);
      console.error(`    └─ ${issue}\n`);
    });
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    warnings.forEach(({ file, issue }) => {
      console.warn(`  ${file}`);
      console.warn(`    └─ ${issue}\n`);
    });
  }

  if (errors.length > 0) {
    console.error('\n💡 Fix: Use lazy initialization pattern:');
    console.error(`
  let instance: SDK | null = null

  function getInstance(): SDK {
    if (instance) return instance
    if (!process.env.SDK_KEY) {
      throw new Error('SDK_KEY not set')
    }
    instance = new SDK(process.env.SDK_KEY)
    return instance
  }

  export const sdk = new Proxy({} as SDK, {
    get: (_target, prop) => {
      const inst = getInstance()
      const value = inst[prop as keyof SDK]
      return typeof value === 'function' ? value.bind(inst) : value
    },
  })
`);
    process.exit(1);
  }

  process.exit(0);
}

main();

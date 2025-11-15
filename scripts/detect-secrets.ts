#!/usr/bin/env ts-node
/**
 * Detect Hardcoded Secrets - Build Security Script
 *
 * Scans code for potential hardcoded secrets and API keys
 * Prevents GitHub Push Protection blocks and security vulnerabilities
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface SecretMatch {
  file: string;
  line: number;
  pattern: string;
  snippet: string;
}

const errors: SecretMatch[] = [];
const warnings: SecretMatch[] = [];

// Patterns to detect potential secrets
const SECRET_PATTERNS = [
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[a-zA-Z0-9]{24,}/g,
    severity: 'error' as const,
  },
  {
    name: 'Stripe Test Key',
    pattern: /sk_test_[a-zA-Z0-9]{24,}/g,
    severity: 'error' as const,
  },
  {
    name: 'Supabase Service Role Key',
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    severity: 'error' as const,
  },
  {
    name: 'API Key Pattern',
    pattern: /api[_-]?key[\s]*[=:][\s]*['"][a-zA-Z0-9]{20,}['"]/gi,
    severity: 'warning' as const,
  },
  {
    name: 'Secret Token Pattern',
    pattern: /secret[\s]*[=:][\s]*['"][a-zA-Z0-9]{20,}['"]/gi,
    severity: 'warning' as const,
  },
  {
    name: 'Password Pattern',
    pattern: /password[\s]*[=:][\s]*['"][^'"]{8,}['"]/gi,
    severity: 'warning' as const,
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'error' as const,
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g,
    severity: 'error' as const,
  },
];

// Files and patterns to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'build',
  'dist',
  '.git',
  '.env.local.example',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.md', // Documentation files
  'detect-secrets.ts', // This file itself
];

function shouldIgnoreFile(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function scanFile(filePath: string): void {
  if (shouldIgnoreFile(filePath)) {
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const { name, pattern, severity } of SECRET_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.matchAll(pattern);

        for (const match of matches) {
          // Skip if it's in a comment explaining the pattern
          if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('#')) {
            continue;
          }

          // Skip if it's obviously a placeholder
          if (match[0].includes('YOUR_') || match[0].includes('PLACEHOLDER') || match[0].includes('xxx')) {
            continue;
          }

          const result = {
            file: filePath.replace(process.cwd(), ''),
            line: i + 1,
            pattern: name,
            snippet: line.trim().substring(0, 100),
          };

          if (severity === 'error') {
            errors.push(result);
          } else {
            warnings.push(result);
          }
        }
      }
    }
  } catch (error) {
    // Ignore files we can't read
  }
}

function scanDirectory(dir: string): void {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      if (shouldIgnoreFile(fullPath)) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    // Ignore
  }
}

function main(): void {
  console.log('🔍 Scanning for Hardcoded Secrets...\n');

  const rootDir = process.cwd();
  scanDirectory(rootDir);

  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ No hardcoded secrets detected!\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.error('❌ CRITICAL: Hardcoded Secrets Found:\n');
    errors.forEach(({ file, line, pattern, snippet }) => {
      console.error(`  ${file}:${line}`);
      console.error(`    └─ Pattern: ${pattern}`);
      console.error(`    └─ Snippet: ${snippet}\n`);
    });
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Potential Secrets (verify these are not real):\n');
    warnings.forEach(({ file, line, pattern, snippet }) => {
      console.warn(`  ${file}:${line}`);
      console.warn(`    └─ Pattern: ${pattern}`);
      console.warn(`    └─ Snippet: ${snippet}\n`);
    });
  }

  if (errors.length > 0) {
    console.error('\n💡 Fix: Move secrets to environment variables');
    console.error('   1. Add to .env.local (gitignored)');
    console.error('   2. Access via process.env.VARIABLE_NAME');
    console.error('   3. Never commit .env.local to git\n');
    console.error('   GitHub Push Protection will block commits with secrets!\n');
    process.exit(1);
  }

  process.exit(0);
}

main();

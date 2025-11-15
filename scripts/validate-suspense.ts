#!/usr/bin/env ts-node
/**
 * Validate Suspense Boundaries - Build Security Script
 *
 * Ensures all components using useSearchParams() are wrapped in Suspense boundaries
 * Prevents Next.js build errors in Vercel deployment
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  file: string;
  issue: string;
}

const errors: ValidationResult[] = [];
const warnings: ValidationResult[] = [];

function findPageFiles(dir: string, results: string[] = []): string[] {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip node_modules, .next, etc.
      if (entry === 'node_modules' || entry === '.next' || entry === 'build' || entry.startsWith('.')) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findPageFiles(fullPath, results);
      } else if (entry === 'page.tsx' || entry === 'page.ts') {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return results;
}

function validateSuspense(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');

  // Check if file uses useSearchParams
  if (!content.includes('useSearchParams')) {
    return; // No useSearchParams, no validation needed
  }

  // Check if it imports Suspense
  const importsSuspense = content.includes("import { Suspense }") ||
                          content.includes("import {Suspense}") ||
                          content.includes("from 'react'") && content.includes('Suspense');

  // Check if there's a Suspense component
  const usesSuspense = content.includes('<Suspense');

  if (!importsSuspense || !usesSuspense) {
    errors.push({
      file: filePath.replace(process.cwd(), ''),
      issue: 'Uses useSearchParams() but missing Suspense boundary',
    });
  }

  // Additional check: if it has Suspense, make sure the component using useSearchParams is wrapped
  if (usesSuspense) {
    // Check if there's a separate content component (common pattern)
    const hasContentComponent = content.match(/function\s+\w+Content\s*\(/);
    const contentComponentWrapped = content.includes('Content />');

    if (hasContentComponent && !contentComponentWrapped) {
      warnings.push({
        file: filePath.replace(process.cwd(), ''),
        issue: 'Has Content component but may not be wrapped in Suspense',
      });
    }
  }
}

function main(): void {
  console.log('🔍 Validating Suspense Boundaries...\n');

  const appDir = join(process.cwd(), 'app');
  const pages = findPageFiles(appDir);

  console.log(`Found ${pages.length} page files\n`);

  for (const page of pages) {
    validateSuspense(page);
  }

  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All pages with useSearchParams() are properly wrapped!\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.error('❌ Suspense Validation Errors:\n');
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
    console.error('\n💡 Fix: Wrap components using useSearchParams() in Suspense:');
    console.error(`
  import { Suspense } from 'react'

  function ContentComponent() {
    const searchParams = useSearchParams()
    // ... component code
  }

  export default function Page() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ContentComponent />
      </Suspense>
    )
  }
`);
    process.exit(1);
  }

  process.exit(0);
}

main();

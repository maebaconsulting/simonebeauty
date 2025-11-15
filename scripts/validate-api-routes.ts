#!/usr/bin/env ts-node
/**
 * Validate API Routes - Build Security Script
 *
 * Ensures all API routes using cookies() or request.url export dynamic = 'force-dynamic'
 * Prevents Next.js static rendering errors in Vercel deployment
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  file: string;
  issue: string;
}

const errors: ValidationResult[] = [];
const warnings: ValidationResult[] = [];

function findApiRoutes(dir: string): string[] {
  const routes: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        routes.push(...findApiRoutes(fullPath));
      } else if (entry === 'route.ts') {
        routes.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors for directories we can't read
  }

  return routes;
}

function validateApiRoute(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');

  // Check if route uses cookies or request.url
  const usesCookies = content.includes('cookies(') || content.includes('cookies.get');
  const usesRequestUrl = content.includes('request.url');
  const usesHeaders = content.includes('headers()');

  const needsDynamic = usesCookies || usesRequestUrl || usesHeaders;

  if (!needsDynamic) {
    return; // No dynamic rendering needed
  }

  // Check if it has the dynamic export
  const hasDynamicExport = content.includes("export const dynamic = 'force-dynamic'") ||
                          content.includes('export const dynamic = "force-dynamic"');

  if (!hasDynamicExport) {
    const reasons = [];
    if (usesCookies) reasons.push('uses cookies()');
    if (usesRequestUrl) reasons.push('uses request.url');
    if (usesHeaders) reasons.push('uses headers()');

    errors.push({
      file: filePath.replace(process.cwd(), ''),
      issue: `Missing 'export const dynamic = "force-dynamic"' (${reasons.join(', ')})`,
    });
  }
}

function main(): void {
  console.log('🔍 Validating API Routes...\n');

  const apiDir = join(process.cwd(), 'app', 'api');
  const routes = findApiRoutes(apiDir);

  console.log(`Found ${routes.length} API routes\n`);

  for (const route of routes) {
    validateApiRoute(route);
  }

  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All API routes are valid!\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.error('❌ API Route Validation Errors:\n');
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
    console.error('\n💡 Fix: Add this line to the top of each file:');
    console.error("   export const dynamic = 'force-dynamic'\n");
    process.exit(1);
  }

  process.exit(0);
}

main();

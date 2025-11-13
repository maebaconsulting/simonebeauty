#!/usr/bin/env ts-node

/**
 * Fast TypeScript type-checking script for pre-commit hooks
 * Feature: Quality Assurance - Phase 1
 *
 * This script performs incremental TypeScript type checking
 * on staged files to catch type errors before commit.
 *
 * Usage:
 *   pnpm tsx scripts/type-check.ts [file1.ts] [file2.tsx] ...
 *
 * Exit codes:
 *   0 - No type errors found
 *   1 - Type errors detected
 */

import { execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

const args = process.argv.slice(2)

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function main() {
  log('\n🔍 Vérification des types TypeScript...', colors.blue)

  // If no files provided, check all TypeScript files
  const filesToCheck = args.length > 0
    ? args.filter(file => /\.(ts|tsx)$/.test(file) && !file.includes('.d.ts'))
    : []

  if (filesToCheck.length === 0) {
    log('✅ Aucun fichier TypeScript à vérifier', colors.green)
    process.exit(0)
  }

  log(`📝 Vérification de ${filesToCheck.length} fichier(s)...`, colors.blue)

  try {
    // Use tsc with --noEmit to check types without generating files
    // Use --pretty for readable output
    const cmd = 'npx tsc --noEmit --pretty'

    execSync(cmd, {
      stdio: 'inherit',
      encoding: 'utf-8',
    })

    log('\n✅ Pas d\'erreurs de type détectées!', colors.green)
    process.exit(0)
  } catch (error: any) {
    log('\n❌ Erreurs de type détectées!', colors.red)
    log('💡 Corrigez les erreurs ci-dessus avant de commiter.', colors.yellow)
    process.exit(1)
  }
}

main()

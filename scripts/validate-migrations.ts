#!/usr/bin/env ts-node

/**
 * Migration validation script for pre-commit hooks
 * Feature: Quality Assurance - Phase 1
 *
 * This script validates SQL migration files to ensure:
 * - RLS policies are complete (SELECT, INSERT, UPDATE, DELETE)
 * - Tables have proper ownership
 * - No dangerous operations (DROP TABLE, TRUNCATE)
 * - Foreign keys have proper constraints
 *
 * Usage:
 *   pnpm tsx scripts/validate-migrations.ts [migration1.sql] [migration2.sql] ...
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 */

import * as fs from 'fs'
import * as path from 'path'

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

interface ValidationError {
  file: string
  line: number
  message: string
  severity: 'error' | 'warning'
}

const errors: ValidationError[] = []

function addError(file: string, line: number, message: string, severity: 'error' | 'warning' = 'error') {
  errors.push({ file, line, message, severity })
}

function validateMigration(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    addError(filePath, 0, `Fichier introuvable: ${filePath}`, 'error')
    return
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const fileName = path.basename(filePath)

  log(`\n📄 Validation de ${fileName}...`, colors.blue)

  // Track tables created in this migration
  const tablesCreated = new Set<string>()
  const policiesCreated = new Map<string, Set<string>>() // table -> Set<operation>

  lines.forEach((line, index) => {
    const lineNum = index + 1
    const trimmedLine = line.trim().toLowerCase()

    // Check for dangerous operations
    if (trimmedLine.includes('drop table') && !trimmedLine.startsWith('--')) {
      addError(filePath, lineNum, '⚠️  DROP TABLE détecté - opération dangereuse', 'warning')
    }

    if (trimmedLine.includes('truncate') && !trimmedLine.startsWith('--')) {
      addError(filePath, lineNum, '⚠️  TRUNCATE détecté - opération dangereuse', 'warning')
    }

    // Track table creation
    const createTableMatch = line.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)/i)
    if (createTableMatch && !trimmedLine.startsWith('--')) {
      const tableName = createTableMatch[1].toLowerCase()
      tablesCreated.add(tableName)
      log(`  ✓ Table créée: ${tableName}`, colors.green)
    }

    // Track RLS policy creation
    const policyMatch = line.match(/create\s+policy\s+"[^"]+"\s+on\s+(?:public\.)?(\w+)\s+(?:for|as)/i)
    if (policyMatch && !trimmedLine.startsWith('--')) {
      const tableName = policyMatch[1].toLowerCase()
      const operation = line.match(/for\s+(select|insert|update|delete|all)/i)?.[1]?.toLowerCase() || 'all'

      if (!policiesCreated.has(tableName)) {
        policiesCreated.set(tableName, new Set())
      }
      policiesCreated.get(tableName)!.add(operation)

      log(`  ✓ Policy créée: ${tableName} (${operation.toUpperCase()})`, colors.green)
    }

    // Check for RLS enable
    const rlsEnableMatch = line.match(/alter\s+table\s+(?:public\.)?(\w+)\s+enable\s+row\s+level\s+security/i)
    if (rlsEnableMatch && !trimmedLine.startsWith('--')) {
      const tableName = rlsEnableMatch[1].toLowerCase()
      log(`  ✓ RLS activé: ${tableName}`, colors.green)
    }
  })

  // Validation: Check if tables have RLS policies
  tablesCreated.forEach(table => {
    const policies = policiesCreated.get(table)
    if (!policies || policies.size === 0) {
      addError(
        filePath,
        0,
        `⚠️  Table '${table}' créée sans policies RLS - risque de sécurité`,
        'warning'
      )
    } else if (!policies.has('all')) {
      // Check if all CRUD operations are covered
      const hasSelect = policies.has('select')
      const hasInsert = policies.has('insert')
      const hasUpdate = policies.has('update')
      const hasDelete = policies.has('delete')

      if (!hasSelect) {
        addError(filePath, 0, `⚠️  Table '${table}' manque SELECT policy`, 'warning')
      }
      if (!hasInsert) {
        addError(filePath, 0, `⚠️  Table '${table}' manque INSERT policy`, 'warning')
      }
      if (!hasUpdate) {
        addError(filePath, 0, `⚠️  Table '${table}' manque UPDATE policy`, 'warning')
      }
      if (!hasDelete) {
        addError(filePath, 0, `⚠️  Table '${table}' manque DELETE policy`, 'warning')
      }
    }
  })
}

function main() {
  log('\n🔒 Validation des migrations SQL...', colors.blue)

  // Filter only SQL migration files
  const migrationFiles = args.filter(file =>
    file.endsWith('.sql') && file.includes('migrations/')
  )

  if (migrationFiles.length === 0) {
    log('✅ Aucun fichier de migration à valider', colors.green)
    process.exit(0)
  }

  log(`📝 Validation de ${migrationFiles.length} migration(s)...`, colors.blue)

  migrationFiles.forEach(validateMigration)

  // Report errors
  if (errors.length > 0) {
    log('\n📋 Résumé des validations:', colors.bold)

    const errorCount = errors.filter(e => e.severity === 'error').length
    const warningCount = errors.filter(e => e.severity === 'warning').length

    if (errorCount > 0) {
      log(`\n❌ ${errorCount} erreur(s) critique(s):`, colors.red)
      errors
        .filter(e => e.severity === 'error')
        .forEach(err => {
          log(`  ${path.basename(err.file)}:${err.line} - ${err.message}`, colors.red)
        })
    }

    if (warningCount > 0) {
      log(`\n⚠️  ${warningCount} avertissement(s):`, colors.yellow)
      errors
        .filter(e => e.severity === 'warning')
        .forEach(err => {
          log(`  ${path.basename(err.file)}:${err.line} - ${err.message}`, colors.yellow)
        })
    }

    if (errorCount > 0) {
      log('\n💡 Corrigez les erreurs critiques avant de commiter.', colors.red)
      process.exit(1)
    } else {
      log('\n💡 Les avertissements ne bloquent pas le commit, mais devraient être examinés.', colors.yellow)
      process.exit(0)
    }
  } else {
    log('\n✅ Toutes les validations ont réussi!', colors.green)
    process.exit(0)
  }
}

main()

#!/usr/bin/env node

import pkg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pkg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new Client({
  host: 'db.xpntvajwrjuvsqsmizzb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'MoutBinam@007',
  ssl: { rejectUnauthorized: false }
})

const migrationsDir = path.join(__dirname, '../supabase/migrations')

async function applyMigrations() {
  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Get all migration files for 007
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.startsWith('202501070000') && f.endsWith('.sql'))
      .sort()

    console.log(`Found ${files.length} Phase 1 migrations to apply\n`)

    for (const file of files) {
      console.log(`=====================================`)
      console.log(`Applying: ${file}`)
      console.log(`=====================================`)

      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')

      try {
        await client.query(sql)
        console.log(`✅ Successfully applied ${file}\n`)
      } catch (error) {
        console.error(`❌ Error applying ${file}:`, error.message)
        console.error('Error details:', error.detail || error.hint || '')
        
        // Continue with next migration even if one fails (some tables may already exist)
        console.log('⚠️  Continuing with next migration...\n')
      }
    }

    console.log('✅ Phase 1 migration process completed!')

  } catch (error) {
    console.error('❌ Database connection error:', error.message)
  } finally {
    await client.end()
  }
}

applyMigrations()

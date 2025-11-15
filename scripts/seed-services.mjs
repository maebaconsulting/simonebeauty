import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function seedServices() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    const sqlPath = path.join(__dirname, '../supabase/seed-services.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('\n📦 Inserting demo services...')
    await client.query(sql)
    console.log('✅ Demo services inserted successfully!')

    // Show summary
    const result = await client.query(`
      SELECT
        category,
        COUNT(*) as count
      FROM services
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `)

    console.log('\n📊 Services Summary:')
    result.rows.forEach((row) => {
      console.log(`   ${row.category}: ${row.count} services`)
    })

    const total = await client.query('SELECT COUNT(*) as total FROM services WHERE is_active = true')
    console.log(`\n✅ Total active services: ${total.rows[0].total}`)
  } catch (error) {
    console.error('❌ Error seeding services:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedServices()

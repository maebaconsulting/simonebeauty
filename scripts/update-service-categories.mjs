import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function updateServiceCategories() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    const sqlPath = path.join(__dirname, '../supabase/update-service-categories.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('\n📝 Updating service categories...')
    await client.query(sql)
    console.log('✅ Service categories updated successfully!')

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

    console.log('\n📊 Services by Category:')
    result.rows.forEach((row) => {
      console.log(`   ${row.category}: ${row.count} services`)
    })

    // Check for any remaining NULL categories
    const nullCount = await client.query(
      'SELECT COUNT(*) as total FROM services WHERE category IS NULL'
    )

    if (parseInt(nullCount.rows[0].total) > 0) {
      console.log(`\n⚠️  Warning: ${nullCount.rows[0].total} services still have NULL category`)
    } else {
      console.log('\n✅ All services have been categorized!')
    }
  } catch (error) {
    console.error('❌ Error updating categories:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

updateServiceCategories()

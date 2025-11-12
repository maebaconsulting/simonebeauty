import pg from 'pg'

const { Client } = pg

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkSchema() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Check services table columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'services'
      ORDER BY ordinal_position
    `)

    console.log('📋 Services table columns:')
    columns.rows.forEach((col) => {
      console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'required'}`)
    })
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkSchema()

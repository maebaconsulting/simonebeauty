import pg from 'pg'

const { Client } = pg

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkServices() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Check if services exist
    const servicesCount = await client.query('SELECT COUNT(*) as total FROM services')
    console.log(`📊 Total services in database: ${servicesCount.rows[0].total}`)

    // Check active services
    const activeCount = await client.query('SELECT COUNT(*) as total FROM services WHERE is_active = true')
    console.log(`✅ Active services: ${activeCount.rows[0].total}`)

    // Show some services
    const services = await client.query(`
      SELECT id, name, slug, category, base_price, is_active
      FROM services
      LIMIT 5
    `)

    console.log('\n📝 Sample services:')
    services.rows.forEach((s) => {
      console.log(`   - ${s.name} (${s.category}) - ${s.base_price}€ - Active: ${s.is_active}`)
    })

    // Check RLS policies on services table
    console.log('\n🔒 Checking RLS policies on services table...')
    const rlsCheck = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE tablename = 'services'
      ORDER BY policyname
    `)

    if (rlsCheck.rows.length === 0) {
      console.log('   ⚠️  No RLS policies found on services table!')
      console.log('   This might prevent clients from reading services.')
    } else {
      console.log(`   Found ${rlsCheck.rows.length} RLS policies:`)
      rlsCheck.rows.forEach((policy) => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) for ${policy.roles}`)
      })
    }

    // Check if RLS is enabled
    const rlsEnabled = await client.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'services'
    `)

    if (rlsEnabled.rows[0]?.relrowsecurity) {
      console.log('\n   ⚠️  RLS is ENABLED on services table')
      console.log('   Make sure there is a SELECT policy for anon/authenticated users')
    } else {
      console.log('\n   RLS is DISABLED on services table')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkServices()

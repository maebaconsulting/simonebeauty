import pg from 'pg'

const { Client } = pg

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function testBookingFlow() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Test 1: Get main categories
    console.log('📋 TEST 1: Get Main Categories')
    console.log('===============================')
    const categories = await client.query(`
      SELECT id, name, slug, icon, display_order
      FROM service_categories
      WHERE parent_id IS NULL AND is_active = true
      ORDER BY display_order
    `)

    console.log(`Found ${categories.rows.length} main categories:\n`)
    for (const cat of categories.rows) {
      // Count services for this category
      const { rows } = await client.query(
        `
        SELECT COUNT(*) as count
        FROM services
        WHERE category_id = $1 AND is_active = true
      `,
        [cat.id]
      )

      console.log(`${cat.icon} ${cat.name}`)
      console.log(`   Slug: ${cat.slug}`)
      console.log(`   Services: ${rows[0].count}`)
      console.log('')
    }

    // Test 2: Get services for first category
    const firstCategory = categories.rows[0]
    console.log(`\n📦 TEST 2: Get Services for "${firstCategory.name}"`)
    console.log('===============================')
    const services = await client.query(
      `
      SELECT id, name, slug, base_price, base_duration_minutes, category_id, subcategory_id
      FROM services
      WHERE category_id = $1 AND is_active = true
      ORDER BY display_order, name
      LIMIT 10
    `,
      [firstCategory.id]
    )

    console.log(`Found ${services.rows.length} services:\n`)
    services.rows.forEach((service) => {
      console.log(`• ${service.name}`)
      console.log(`  Price: ${service.base_price}€ | Duration: ${service.base_duration_minutes}min`)
      console.log(`  Category ID: ${service.category_id} | Subcategory ID: ${service.subcategory_id}`)
      console.log('')
    })

    // Test 3: Get subcategories for first category
    console.log(`\n📂 TEST 3: Get Subcategories for "${firstCategory.name}"`)
    console.log('===============================')
    const subcategories = await client.query(
      `
      SELECT id, name, slug
      FROM service_categories
      WHERE parent_id = $1 AND is_active = true
      ORDER BY display_order
    `,
      [firstCategory.id]
    )

    console.log(`Found ${subcategories.rows.length} subcategories:\n`)
    for (const subcat of subcategories.rows) {
      const { rows } = await client.query(
        `
        SELECT COUNT(*) as count
        FROM services
        WHERE subcategory_id = $1 AND is_active = true
      `,
        [subcat.id]
      )

      console.log(`• ${subcat.name} (${rows[0].count} services)`)
    }

    // Test 4: Check RLS policies
    console.log('\n\n🔒 TEST 4: Check RLS Policies')
    console.log('===============================')

    const servicesPolicies = await client.query(`
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE tablename = 'services'
      ORDER BY policyname
    `)

    console.log('Services table policies:')
    servicesPolicies.rows.forEach((policy) => {
      console.log(`  • ${policy.policyname} (${policy.cmd}) - ${policy.roles}`)
    })

    const categoriesPolicies = await client.query(`
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE tablename = 'service_categories'
      ORDER BY policyname
    `)

    console.log('\nService categories table policies:')
    categoriesPolicies.rows.forEach((policy) => {
      console.log(`  • ${policy.policyname} (${policy.cmd}) - ${policy.roles}`)
    })

    console.log('\n\n✅ All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

testBookingFlow()

import pg from 'pg'

const { Client } = pg

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkCategories() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Check if categories table exists
    const categoriesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'service_categories'
      )
    `)

    if (categoriesExists.rows[0].exists) {
      console.log('📁 service_categories table exists\n')

      // Get categories
      const categories = await client.query(`
        SELECT id, name, slug, display_order, icon
        FROM service_categories
        ORDER BY display_order
      `)

      console.log(`Found ${categories.rows.length} categories:`)
      categories.rows.forEach((cat) => {
        console.log(`   ${cat.icon || '📦'} ${cat.name} (slug: ${cat.slug}, id: ${cat.id})`)
      })
    } else {
      console.log('❌ service_categories table does not exist\n')
    }

    // Check if subcategories table exists
    const subcategoriesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'service_subcategories'
      )
    `)

    if (subcategoriesExists.rows[0].exists) {
      console.log('\n📁 service_subcategories table exists\n')

      // Get subcategories
      const subcategories = await client.query(`
        SELECT id, name, slug, category_id, display_order
        FROM service_subcategories
        ORDER BY category_id, display_order
      `)

      console.log(`Found ${subcategories.rows.length} subcategories:`)
      subcategories.rows.forEach((sub) => {
        console.log(`   - ${sub.name} (category_id: ${sub.category_id}, id: ${sub.id})`)
      })
    } else {
      console.log('\n❌ service_subcategories table does not exist\n')
    }

    // Check how many services have category_id and subcategory_id set
    console.log('\n📊 Services with categories:')
    const servicesWithCategory = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE category_id IS NOT NULL) as with_category,
        COUNT(*) FILTER (WHERE subcategory_id IS NOT NULL) as with_subcategory,
        COUNT(*) as total
      FROM services
    `)

    const stats = servicesWithCategory.rows[0]
    console.log(`   Total services: ${stats.total}`)
    console.log(`   With category_id: ${stats.with_category}`)
    console.log(`   With subcategory_id: ${stats.with_subcategory}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkCategories()

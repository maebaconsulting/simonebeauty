import pg from 'pg'

const { Client } = pg

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

async function checkCategoryStructure() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Check service_categories table schema
    console.log('📋 service_categories table columns:')
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'service_categories'
      ORDER BY ordinal_position
    `)

    columns.rows.forEach((col) => {
      console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'required'}`)
    })

    // Check some sample categories to understand the hierarchy
    console.log('\n📊 Sample categories with all fields:')
    const samples = await client.query(`
      SELECT *
      FROM service_categories
      ORDER BY display_order
      LIMIT 10
    `)

    samples.rows.forEach((cat) => {
      console.log(`\nID: ${cat.id}`)
      console.log(`Name: ${cat.name}`)
      console.log(`Slug: ${cat.slug}`)
      console.log(`Icon: ${cat.icon}`)
      console.log(`Parent ID: ${cat.parent_id}`)
      console.log(`Display Order: ${cat.display_order}`)
    })

    // Check which categories have parent_id NULL (main categories)
    console.log('\n🏷️  Main Categories (parent_id IS NULL):')
    const mainCategories = await client.query(`
      SELECT id, name, slug, icon, display_order
      FROM service_categories
      WHERE parent_id IS NULL
      ORDER BY display_order
    `)

    mainCategories.rows.forEach((cat) => {
      console.log(`   ${cat.icon} ${cat.name} (id: ${cat.id})`)
    })

    // Check subcategories for each main category
    console.log('\n📂 Subcategories by Main Category:')
    for (const mainCat of mainCategories.rows) {
      const subcats = await client.query(
        `
        SELECT id, name, slug
        FROM service_categories
        WHERE parent_id = $1
        ORDER BY display_order
      `,
        [mainCat.id]
      )

      if (subcats.rows.length > 0) {
        console.log(`\n   ${mainCat.icon} ${mainCat.name}:`)
        subcats.rows.forEach((sub) => {
          console.log(`      - ${sub.name} (id: ${sub.id})`)
        })
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkCategoryStructure()

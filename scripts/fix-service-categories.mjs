import pg from 'pg'

const { Client } = pg

const connectionString =
  'postgresql://postgres:MoutBinam@007@db.xpntvajwrjuvsqsmizzb.supabase.co:5432/postgres'

// Mapping keywords to categories
const categoryMapping = {
  massage: ['massage', 'relaxation', 'shiatsu', 'thaï', 'californien', 'suédois', 'sportif'],
  beauty: ['soin', 'visage', 'manucure', 'pédicure', 'onglerie', 'épilation', 'cire'],
  hair: [
    'coiffure',
    'coupe',
    'coloration',
    'brushing',
    'balayage',
    'chignon',
    'tresse',
    'attache',
    'up do',
    'coiffage',
  ],
  health: ['réflexologie', 'acupuncture', 'ostéopathie', 'kinésithérapie'],
  wellness: ['yoga', 'méditation', 'pilates', 'fitness'],
}

function detectCategory(name) {
  const nameLower = name.toLowerCase()

  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some((keyword) => nameLower.includes(keyword))) {
      return category
    }
  }

  return 'other' // Default category
}

async function fixCategories() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Get all services
    const services = await client.query('SELECT id, name, category FROM services')
    console.log(`📊 Found ${services.rows.length} services to process\n`)

    let updated = 0
    let skipped = 0

    for (const service of services.rows) {
      if (!service.category) {
        const detectedCategory = detectCategory(service.name)

        await client.query('UPDATE services SET category = $1 WHERE id = $2', [
          detectedCategory,
          service.id,
        ])

        console.log(`✅ Updated "${service.name}" → ${detectedCategory}`)
        updated++
      } else {
        skipped++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped (already had category): ${skipped}`)

    // Show category breakdown
    const breakdown = await client.query(`
      SELECT category, COUNT(*) as count
      FROM services
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `)

    console.log(`\n📊 Category Breakdown:`)
    breakdown.rows.forEach((row) => {
      console.log(`   ${row.category}: ${row.count} services`)
    })
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

fixCategories()

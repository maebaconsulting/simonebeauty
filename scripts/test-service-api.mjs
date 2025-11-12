import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpntvajwrjuvsqsmizzb.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbnR2YWp3cmp1dnNxc21penpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2MjgxMzQsImV4cCI6MjA1ODIwNDEzNH0.jwCF_KAv7L8ZoXaWjX0YW8EwbOEQjsO1BcWf3mHoWpQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testServiceAPI() {
  console.log('🧪 Testing Supabase Service API\n')
  console.log('=' + '='.repeat(50) + '\n')

  try {
    // Test 1: Get service categories
    console.log('📋 TEST 1: Get Service Categories')
    console.log('-'.repeat(50))

    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('id, name, slug, icon, display_order')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError)
    } else {
      console.log(`✅ Found ${categories?.length || 0} categories:\n`)
      categories?.forEach((cat) => {
        console.log(`   ${cat.icon || '📦'} ${cat.name} (slug: ${cat.slug})`)
      })
    }

    // Test 2: Get all services
    console.log('\n\n📦 TEST 2: Get All Services')
    console.log('-'.repeat(50))

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(5)

    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError)
    } else {
      console.log(`✅ Found ${services?.length || 0} services (showing first 5):\n`)
      services?.forEach((service) => {
        console.log(`   • ${service.name}`)
        console.log(`     Price: ${service.base_price}€ | Category ID: ${service.category_id}`)
      })
    }

    // Test 3: Count services
    console.log('\n\n🔢 TEST 3: Count Services')
    console.log('-'.repeat(50))

    const { count, error: countError } = await supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (countError) {
      console.error('❌ Error counting services:', countError)
    } else {
      console.log(`✅ Total active services: ${count}`)
    }

    // Test 4: Test RLS policies
    console.log('\n\n🔒 TEST 4: Test RLS Policies (Anonymous Access)')
    console.log('-'.repeat(50))

    // Try to access without auth
    const { data: publicServices, error: publicError } = await supabase
      .from('services')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)

    if (publicError) {
      console.error('❌ Cannot access services as anonymous:', publicError.message)
      console.log('\n⚠️  RLS may be blocking anonymous access!')
    } else {
      console.log(`✅ Anonymous access works! Found ${publicServices?.length || 0} services`)
    }

    // Test 5: Get services for first category
    if (categories && categories.length > 0) {
      const firstCat = categories[0]
      console.log(`\n\n🎯 TEST 5: Get Services for Category "${firstCat.name}"`)
      console.log('-'.repeat(50))

      const { data: catServices, error: catError } = await supabase
        .from('services')
        .select('id, name, category_id')
        .eq('category_id', firstCat.id)
        .eq('is_active', true)
        .limit(3)

      if (catError) {
        console.error('❌ Error fetching services by category:', catError)
      } else {
        console.log(`✅ Found ${catServices?.length || 0} services in this category:\n`)
        catServices?.forEach((s) => {
          console.log(`   • ${s.name}`)
        })
      }
    }

    console.log('\n\n' + '='.repeat(50))
    console.log('✅ All API tests completed!')
  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
  }
}

testServiceAPI()

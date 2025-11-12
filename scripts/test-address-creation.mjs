#!/usr/bin/env node

import pkg from 'pg'
const { Client } = pkg

const client = new Client({
  host: 'db.xpntvajwrjuvsqsmizzb.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'MoutBinam@007',
  ssl: { rejectUnauthorized: false }
})

async function testAddressCreation() {
  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Get a test user from auth.users
    const userResult = await client.query(`
      SELECT au.id, au.email
      FROM auth.users au
      INNER JOIN profiles p ON au.id = p.id
      WHERE p.role = 'client'
      LIMIT 1
    `)

    if (userResult.rows.length === 0) {
      console.log('❌ No client users found in database')
      return
    }

    const testUser = userResult.rows[0]
    console.log('📝 Test user:', testUser.email, '(', testUser.id, ')')

    // Try to insert a test address
    console.log('\n🔍 Attempting to create address...')
    const addressData = {
      client_id: testUser.id,
      type: 'home',
      label: 'Test Address',
      street: '123 Rue de Test',
      city: 'Paris',
      postal_code: '75001',
      country: 'FR',
      is_default: false,
      latitude: null,
      longitude: null
    }

    console.log('Address data:', addressData)

    const insertResult = await client.query(`
      INSERT INTO client_addresses (client_id, type, label, street, city, postal_code, country, is_default, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      addressData.client_id,
      addressData.type,
      addressData.label,
      addressData.street,
      addressData.city,
      addressData.postal_code,
      addressData.country,
      addressData.is_default,
      addressData.latitude,
      addressData.longitude
    ])

    console.log('\n✅ Address created successfully!')
    console.log('Created address:', insertResult.rows[0])

    // Check RLS policies
    console.log('\n🔍 Checking RLS policies on client_addresses...')
    const policiesResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'client_addresses'
      ORDER BY policyname
    `)

    console.log('\nRLS Policies:')
    policiesResult.rows.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd}):`)
      console.log(`    Roles: ${policy.roles}`)
      console.log(`    Using: ${policy.qual || 'N/A'}`)
      console.log(`    With check: ${policy.with_check || 'N/A'}`)
    })

    // Clean up test address
    await client.query(`
      DELETE FROM client_addresses WHERE id = $1
    `, [insertResult.rows[0].id])
    console.log('\n🧹 Test address deleted')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Error code:', error.code)
    console.error('Error detail:', error.detail)
    console.error('Error hint:', error.hint)
  } finally {
    await client.end()
  }
}

testAddressCreation()

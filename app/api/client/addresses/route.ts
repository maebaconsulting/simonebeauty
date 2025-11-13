import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/addresses
 * Fetch all addresses for the authenticated client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch client's addresses
    const { data: addresses, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('client_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching addresses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ addresses: addresses || [] })
  } catch (error) {
    console.error('Error in addresses GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/client/addresses
 * Create a new address for the authenticated client
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      label,
      street,
      city,
      postal_code,
      country,
      latitude,
      longitude,
      building_info,
      delivery_instructions,
      is_default,
    } = body

    // Validate required fields
    if (!street || !city || !postal_code) {
      return NextResponse.json(
        { error: 'Missing required fields: street, city, postal_code' },
        { status: 400 }
      )
    }

    // Insert new address
    const { data: newAddress, error } = await supabase
      .from('client_addresses')
      .insert({
        client_id: user.id,
        type: type || 'home',
        label,
        street,
        city,
        postal_code,
        country: country || 'FR',
        latitude,
        longitude,
        building_info,
        delivery_instructions,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating address:', error)
      return NextResponse.json(
        { error: 'Failed to create address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ address: newAddress }, { status: 201 })
  } catch (error) {
    console.error('Error in addresses POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

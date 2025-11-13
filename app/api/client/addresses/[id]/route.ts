import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/client/addresses/[id]
 * Update an existing address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addressId = parseInt(params.id)
    if (isNaN(addressId)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 })
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

    // Update address (RLS will ensure user owns this address)
    const { data: updatedAddress, error } = await supabase
      .from('client_addresses')
      .update({
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
      })
      .eq('id', addressId)
      .eq('client_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating address:', error)
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      )
    }

    if (!updatedAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error('Error in address PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/client/addresses/[id]
 * Soft delete an address (set is_active to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addressId = parseInt(params.id)
    if (isNaN(addressId)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('client_addresses')
      .update({ is_active: false })
      .eq('id', addressId)
      .eq('client_id', user.id)

    if (error) {
      console.error('Error deleting address:', error)
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in address DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

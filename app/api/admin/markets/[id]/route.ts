import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/markets/[id]
 * Get a single market by ID
 * Public access for active markets, admin/manager for all
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const marketId = parseInt(params.id)

    if (isNaN(marketId)) {
      return NextResponse.json(
        { error: 'Invalid market ID' },
        { status: 400 }
      )
    }

    const { data: market, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single()

    if (error) {
      console.error('Error fetching market:', error)
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: market,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/markets/[id]
 * Update a market (admin/manager only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verify admin/manager access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const marketId = parseInt(params.id)

    if (isNaN(marketId)) {
      return NextResponse.json(
        { error: 'Invalid market ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { code, name, currency_code, timezone, language_codes, tax_rate, is_active } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (code !== undefined) updateData.code = code
    if (name !== undefined) updateData.name = name
    if (currency_code !== undefined) updateData.currency_code = currency_code
    if (timezone !== undefined) updateData.timezone = timezone
    if (language_codes !== undefined) updateData.language_codes = language_codes
    if (tax_rate !== undefined) updateData.tax_rate = tax_rate
    if (is_active !== undefined) updateData.is_active = is_active

    // Update market
    const { data: market, error } = await supabase
      .from('markets')
      .update(updateData)
      .eq('id', marketId)
      .select()
      .single()

    if (error) {
      console.error('Error updating market:', error)
      return NextResponse.json(
        { error: 'Failed to update market' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: market,
      message: 'Market updated successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/markets/[id]
 * Soft delete (deactivate) a market (admin/manager only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verify admin/manager access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const marketId = parseInt(params.id)

    if (isNaN(marketId)) {
      return NextResponse.json(
        { error: 'Invalid market ID' },
        { status: 400 }
      )
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('markets')
      .update({ is_active: false })
      .eq('id', marketId)

    if (error) {
      console.error('Error deactivating market:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate market' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Market deactivated successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

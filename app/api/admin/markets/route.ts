import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/markets
 * List all markets with optional filters
 * Public access for active markets, admin/manager for all
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const is_active = searchParams.get('is_active')
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'name'
    const order = searchParams.get('order') || 'asc'
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('markets')
      .select('*', { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })

    // Filter by active status (public users can only see active markets via RLS)
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true')
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: markets, error, count } = await query

    if (error) {
      console.error('Error fetching markets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch markets' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: markets || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
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
 * POST /api/admin/markets
 * Create a new market (admin/manager only)
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { code, name, currency_code, timezone, language_codes, tax_rate, is_active } = body

    // Validate required fields
    if (!code || !name || !currency_code) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, currency_code' },
        { status: 400 }
      )
    }

    // Create market
    const { data: market, error } = await supabase
      .from('markets')
      .insert({
        code,
        name,
        currency_code,
        timezone,
        language_codes,
        tax_rate,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating market:', error)
      return NextResponse.json(
        { error: 'Failed to create market' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: market,
      message: 'Market created successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

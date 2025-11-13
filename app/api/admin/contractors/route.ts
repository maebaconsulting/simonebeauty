import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/contractors
 * List all contractors with optional search (admin/manager only)
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const market_id = searchParams.get('market_id')

    // Build query with counts for bookings and services
    let query = supabase
      .from('contractors')
      .select(
        `
        *,
        market:markets(id, name, code, currency_code),
        bookings:appointment_bookings(count),
        services:contractor_services(count)
      `,
        { count: 'exact' }
      )
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    // Add market filter if provided
    if (market_id) {
      query = query.eq('market_id', parseInt(market_id))
    }

    // Add search filter if provided
    if (search) {
      // Search by contractor code or business name
      const codePattern = search.toUpperCase()
      query = query.or(
        `contractor_code.ilike.%${codePattern}%,business_name.ilike.%${search}%,professional_title.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const { data: rawContractors, error, count } = await query

    if (error) {
      console.error('Error fetching contractors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      )
    }

    // Transform data to match ContractorWithCode type
    const contractors = (rawContractors || []).map((contractor: any) => ({
      ...contractor,
      _count: {
        bookings: contractor.bookings?.[0]?.count || 0,
        services: contractor.services?.[0]?.count || 0,
      },
      bookings: undefined, // Remove raw count data
      services: undefined, // Remove raw count data
    }))

    // Calculate total pages
    const totalPages = Math.ceil((count || 0) / limit)

    // Return response matching ContractorListResponse type
    return NextResponse.json({
      data: contractors,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

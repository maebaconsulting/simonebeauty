import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/clients
 * List all clients with optional search (admin/manager only)
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
    const market_id = searchParams.get('market_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get sort parameters
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    // Build query with market relation
    let query = supabase
      .from('profiles')
      .select(
        `
        *,
        market:markets(id, name, code, currency_code)
      `,
        { count: 'exact' }
      )
      .eq('role', 'client')
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    // Add market filter if provided
    if (market_id) {
      query = query.eq('market_id', parseInt(market_id))
    }

    // Add search filter if provided
    if (search) {
      // Search by client code or name
      const codePattern = search.toUpperCase()
      query = query.or(
        `client_code.ilike.%${codePattern}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      )
    }

    const { data: rawClients, error, count } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    // Get stats for each client using RPC function
    const clientsWithStats = await Promise.all(
      (rawClients || []).map(async (client: any) => {
        const { data: stats } = await supabase
          .rpc('get_client_stats', { p_profile_id: client.id })
          .single()

        return {
          ...client,
          _count: {
            bookings: stats?.bookings_count || 0,
            addresses: stats?.addresses_count || 0,
          },
          market: client.market || null, // Keep market info from join
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil((count || 0) / limit)

    // Return response matching ClientListResponse type
    return NextResponse.json({
      data: clientsWithStats,
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

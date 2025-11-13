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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get sort parameters
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    // Build query with counts for bookings and addresses
    let query = supabase
      .from('profiles')
      .select(
        `
        *,
        bookings:appointment_bookings(count),
        addresses:client_addresses(count)
      `,
        { count: 'exact' }
      )
      .eq('role', 'client')
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    // Add search filter if provided
    if (search) {
      // Search by client code or name
      const codePattern = search.toUpperCase()
      query = query.or(
        `client_code.ilike.%${codePattern}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
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

    // Transform data to match ClientWithCode type
    const clients = (rawClients || []).map((client: any) => ({
      ...client,
      _count: {
        bookings: client.bookings?.[0]?.count || 0,
        addresses: client.addresses?.[0]?.count || 0,
      },
      bookings: undefined, // Remove raw count data
      addresses: undefined, // Remove raw count data
    }))

    // Calculate total pages
    const totalPages = Math.ceil((count || 0) / limit)

    // Return response matching ClientListResponse type
    return NextResponse.json({
      data: clients,
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

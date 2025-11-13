import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/clients/[code]
 * Fetch single client by unique code (admin/manager only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
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

    const { code } = params

    // Validate code format (CLI-XXXXXX)
    if (!code || !/^CLI-\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid client code format. Expected CLI-XXXXXX' },
        { status: 400 }
      )
    }

    // Fetch client with counts
    const { data: rawClient, error } = await supabase
      .from('profiles')
      .select(
        `
        *,
        bookings:appointment_bookings(count),
        addresses:client_addresses(count)
      `
      )
      .eq('client_code', code)
      .eq('role', 'client')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching client:', error)
      return NextResponse.json(
        { error: 'Failed to fetch client' },
        { status: 500 }
      )
    }

    // Transform data to match ClientWithCode type
    const client = {
      ...rawClient,
      _count: {
        bookings: rawClient.bookings?.[0]?.count || 0,
        addresses: rawClient.addresses?.[0]?.count || 0,
      },
      bookings: undefined, // Remove raw count data
      addresses: undefined, // Remove raw count data
    }

    // Return response matching ClientDetailResponse type
    return NextResponse.json({
      data: client,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

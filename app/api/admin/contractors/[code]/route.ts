import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/contractors/[code]
 * Fetch single contractor by unique code (admin/manager only)
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

    // Validate code format (CTR-XXXXXX)
    if (!code || !/^CTR-\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid contractor code format. Expected CTR-XXXXXX' },
        { status: 400 }
      )
    }

    // Fetch contractor with counts
    const { data: rawContractor, error } = await supabase
      .from('contractors')
      .select(
        `
        *,
        market:markets(id, name, code, currency_code),
        bookings:appointment_bookings(count),
        services:contractor_services(count)
      `
      )
      .eq('contractor_code', code)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: 'Contractor not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching contractor:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contractor' },
        { status: 500 }
      )
    }

    // Transform data to match ContractorWithCode type
    const contractor = {
      ...rawContractor,
      _count: {
        bookings: rawContractor.bookings?.[0]?.count || 0,
        services: rawContractor.services?.[0]?.count || 0,
      },
      bookings: undefined, // Remove raw count data
      services: undefined, // Remove raw count data
    }

    // Return response matching ContractorDetailResponse type
    return NextResponse.json({
      data: contractor,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Build query
    let query = supabase
      .from('contractors')
      .select('*, profiles!inner(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add search filter if provided
    if (search) {
      // Search by contractor code, name, or specialty
      const codePattern = search.toUpperCase()
      query = query.or(
        `contractor_code.ilike.%${codePattern}%,profiles.first_name.ilike.%${search}%,profiles.last_name.ilike.%${search}%,specialty.ilike.%${search}%`
      )
    }

    const { data: contractors, error, count } = await query

    if (error) {
      console.error('Error fetching contractors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      contractors: contractors || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

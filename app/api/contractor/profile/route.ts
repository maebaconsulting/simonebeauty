import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/contractor/profile
 * Fetch profile and contractor info for the authenticated contractor
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

    // Fetch profile and contractor info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch contractor info with market
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select(`
        *,
        market:markets(id, name, code, currency_code)
      `)
      .eq('id', user.id)
      .single()

    if (contractorError) {
      console.error('Error fetching contractor:', contractorError)
      // If contractor not found, return profile without contractor info
      if (contractorError.code === 'PGRST116') {
        return NextResponse.json({ profile, contractor: null })
      }
      return NextResponse.json(
        { error: 'Failed to fetch contractor info' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile, contractor })
  } catch (error) {
    console.error('Error in contractor profile GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/contractor/profile
 * Update profile for the authenticated contractor
 */
export async function PUT(request: NextRequest) {
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
      first_name,
      last_name,
      phone,
      date_of_birth,
      preferred_language,
    } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name' },
        { status: 400 }
      )
    }

    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        phone,
        date_of_birth,
        preferred_language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Error in contractor profile PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/client/bookings
 * Fetch all bookings for the authenticated client
 * Query params: ?status=upcoming|past|cancelled
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

    // Get query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // upcoming, past, cancelled

    // Base query - appointment_bookings doesn't have address_id FK, data is embedded
    let query = supabase
      .from('appointment_bookings')
      .select(`
        id,
        client_id,
        contractor_id,
        service_id,
        scheduled_datetime,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        service_name,
        service_amount,
        service_address,
        service_city,
        service_postal_code,
        status,
        created_at,
        updated_at
      `)
      .eq('client_id', user.id)

    // Apply status filter
    const now = new Date().toISOString()

    if (statusFilter === 'upcoming') {
      query = query
        .gte('scheduled_datetime', now)
        .in('status', ['confirmed', 'pending'])
        .order('scheduled_datetime', { ascending: true })
    } else if (statusFilter === 'past') {
      query = query
        .lt('scheduled_datetime', now)
        .eq('status', 'completed')
        .order('scheduled_datetime', { ascending: false })
    } else if (statusFilter === 'cancelled') {
      query = query
        .eq('status', 'cancelled')
        .order('scheduled_datetime', { ascending: false })
    } else {
      // Default: all bookings, most recent first
      query = query.order('created_at', { ascending: false })
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // Transform bookings to match expected format
    const transformedBookings = (bookings || []).map((booking: any) => ({
      id: booking.id,
      scheduled_at: booking.scheduled_datetime, // Map to expected field name
      status: booking.status,
      service_amount: booking.service_amount,
      services: {
        id: booking.service_id,
        name: booking.service_name,
        duration: booking.duration_minutes,
        base_price: booking.service_amount,
      },
      addresses: {
        id: 0, // Not linked to address table
        street: booking.service_address,
        city: booking.service_city,
        postal_code: booking.service_postal_code,
      },
      contractors: booking.contractor_id
        ? {
            id: booking.contractor_id,
            slug: '', // TODO: fetch from profiles if needed
            contractor_profiles: [
              {
                business_name: 'Prestataire', // TODO: fetch from profiles if needed
              },
            ],
          }
        : null,
    }))

    console.log('[Client Bookings API] Found bookings:', transformedBookings.length)

    return NextResponse.json({ bookings: transformedBookings })
  } catch (error) {
    console.error('Error in bookings GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get Weekly Planning Edge Function
 * Task: T065
 * Feature: 007-contractor-interface
 *
 * Fetches all bookings for a contractor within a specified week
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetWeeklyPlanningRequest {
  contractor_id: number
  week_start: string // YYYY-MM-DD format
  week_end: string   // YYYY-MM-DD format
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { contractor_id, week_start, week_end }: GetWeeklyPlanningRequest = await req.json()

    // Validate required fields
    if (!contractor_id || !week_start || !week_end) {
      return new Response(
        JSON.stringify({ error: 'contractor_id, week_start, and week_end are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(week_start) || !dateRegex.test(week_end)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user owns this contractor record or is an admin
    const { data: contractor, error: contractorError } = await supabaseClient
      .from('contractors')
      .select('id, is_active, is_verified')
      .eq('id', contractor_id)
      .single()

    if (contractorError || !contractor) {
      return new Response(
        JSON.stringify({ error: 'Contractor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check permission
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = contractor.id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to access this contractor planning' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch bookings for the specified week
    // Note: appointment_bookings already contains denormalized client and service info
    // Convert week boundaries to UTC datetimes for comparison
    const weekStartUTC = new Date(`${week_start}T00:00:00Z`).toISOString()
    const weekEndUTC = new Date(`${week_end}T23:59:59Z`).toISOString()

    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('appointment_bookings')
      .select(`
        id,
        scheduled_datetime,
        booking_timezone,
        duration_minutes,
        status,
        client_name,
        client_phone,
        client_email,
        service_name,
        service_address,
        service_city,
        service_postal_code,
        service_latitude,
        service_longitude,
        service_amount,
        travel_time_before,
        travel_time_after,
        created_at
      `)
      .eq('contractor_id', contractor_id)
      .gte('scheduled_datetime', weekStartUTC)
      .lte('scheduled_datetime', weekEndUTC)
      .order('scheduled_datetime', { ascending: true })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookings', details: bookingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform bookings to match expected format
    const transformedBookings = (bookings || []).map((booking) => {
      // Convert UTC datetime to Paris local time for display
      const scheduledDateTimeUTC = new Date(booking.scheduled_datetime)

      // Format date in Paris timezone
      const scheduled_date = scheduledDateTimeUTC.toLocaleDateString('en-CA', {
        timeZone: 'Europe/Paris',
      }) // Returns YYYY-MM-DD format

      // Format start time in Paris timezone
      const scheduled_start_time = scheduledDateTimeUTC.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Europe/Paris',
        hour12: false,
      }) // Returns HH:mm:ss format

      // Calculate end time based on start time + duration
      const endDateTimeUTC = new Date(scheduledDateTimeUTC.getTime() + booking.duration_minutes * 60000)
      const scheduled_end_time = endDateTimeUTC.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Europe/Paris',
        hour12: false,
      })

      return {
        id: booking.id,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        status: booking.status,
        client_name: booking.client_name,
        service_name: booking.service_name,
        service_address: booking.service_address,
        service_city: booking.service_city,
        service_amount: booking.service_amount,
        // Travel times from database (calculated via Google Distance Matrix API)
        travel_time_before: booking.travel_time_before || null,
        travel_time_after: booking.travel_time_after || null,
      }
    })

    console.log(`✅ Fetched ${transformedBookings.length} bookings for contractor ${contractor_id} (${week_start} to ${week_end})`)

    return new Response(
      JSON.stringify({
        success: true,
        bookings: transformedBookings,
        week_start,
        week_end,
        contractor_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Get Pending Booking Requests Edge Function
 * Task: T069
 * Feature: 007-contractor-interface
 *
 * Fetches booking requests with status='pending' and not expired
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetPendingRequestsParams {
  contractor_id: string
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
    const { contractor_id }: GetPendingRequestsParams = await req.json()

    if (!contractor_id) {
      return new Response(
        JSON.stringify({ error: 'contractor_id is required' }),
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
        JSON.stringify({ error: 'Forbidden: You do not have permission to access these requests' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch pending booking requests with join to appointment_bookings
    const { data: requests, error: requestsError } = await supabaseClient
      .from('booking_requests')
      .select(`
        *,
        appointment_bookings:booking_id (
          id,
          scheduled_datetime,
          booking_timezone,
          duration_minutes,
          service_name,
          service_address,
          service_city,
          service_postal_code,
          service_amount,
          client_name,
          client_phone,
          client_email
        )
      `)
      .eq('contractor_id', contractor_id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString()) // Not yet expired
      .order('requested_at', { ascending: true }) // Oldest first

    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch requests', details: requestsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform data to match expected format
    const transformedRequests = (requests || []).map((request) => {
      // Get booking data (it's returned as an object, not array)
      const booking = Array.isArray(request.appointment_bookings)
        ? request.appointment_bookings[0]
        : request.appointment_bookings

      // Log raw booking data for debugging
      console.log('🔍 Raw request data:', {
        request_id: request.id,
        booking_id: request.booking_id,
        has_appointment_bookings: !!request.appointment_bookings,
        appointment_bookings_type: Array.isArray(request.appointment_bookings) ? 'array' : typeof request.appointment_bookings,
        booking_exists: !!booking,
        booking_scheduled_datetime: booking?.scheduled_datetime,
      })

      return {
        id: request.id,
        booking_id: request.booking_id,
        contractor_id: request.contractor_id,
        status: request.status,
        requested_at: request.requested_at,
        expires_at: request.expires_at,
        responded_at: request.responded_at,
        contractor_message: request.contractor_message,
        refusal_reason: request.refusal_reason,
        booking: booking
          ? {
              id: booking.id,
              scheduled_datetime: booking.scheduled_datetime,
              booking_timezone: booking.booking_timezone,
              duration_minutes: booking.duration_minutes,
              service_name: booking.service_name,
              service_address: booking.service_address,
              service_city: booking.service_city,
              service_postal_code: booking.service_postal_code,
              service_amount: booking.service_amount,
              client_name: booking.client_name,
              client_phone: booking.client_phone,
              client_email: booking.client_email,
            }
          : null,
        created_at: request.created_at,
        updated_at: request.updated_at,
      }
    })

    console.log(`✅ Fetched ${transformedRequests.length} pending requests for contractor ${contractor_id}`)
    if (transformedRequests.length > 0) {
      console.log('📦 Sample transformed request:', JSON.stringify(transformedRequests[0], null, 2))
    }

    return new Response(
      JSON.stringify({
        success: true,
        requests: transformedRequests,
        count: transformedRequests.length,
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

/**
 * Mark Service Completed Edge Function
 * Task: T077
 * Feature: 007-contractor-interface
 *
 * Marks a booking as completed when the contractor finishes the service
 * Updates status to 'completed' and sets completed_at timestamp
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarkCompletedParams {
  booking_id: number
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
    const { booking_id, contractor_id }: MarkCompletedParams = await req.json()

    if (!booking_id || !contractor_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id and contractor_id are required' }),
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
        JSON.stringify({ error: 'Forbidden: You do not have permission to complete this booking' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('appointment_bookings')
      .select('id, status, contractor_id, payment_status')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify booking belongs to this contractor
    if (booking.contractor_id !== contractor_id) {
      return new Response(
        JSON.stringify({ error: 'This booking does not belong to the specified contractor' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate booking status
    if (booking.status !== 'in_progress') {
      return new Response(
        JSON.stringify({
          error: `Cannot mark booking as completed. Current status: ${booking.status}. Only bookings with status 'in_progress' can be marked as completed.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()

    // Update booking status to completed
    const { error: updateError } = await supabaseClient
      .from('appointment_bookings')
      .update({
        status: 'completed',
        completed_at: now,
        updated_at: now,
      })
      .eq('id', booking_id)

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update booking status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Booking ${booking_id} marked as completed by contractor ${contractor_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        booking_id,
        status: 'completed',
        completed_at: now,
        message: 'Service marked as completed successfully'
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

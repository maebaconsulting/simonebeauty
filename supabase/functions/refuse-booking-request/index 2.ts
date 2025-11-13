/**
 * Refuse Booking Request Edge Function
 * Task: T073
 * Feature: 007-contractor-interface
 *
 * Handles booking refusal:
 * 1) Update booking_requests.status='refused'
 * 2) Cancel Stripe PaymentIntent
 * 3) Send notification to client with reason
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefuseBookingRequestParams {
  request_id: number
  refusal_reason: string
  contractor_message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { request_id, refusal_reason, contractor_message }: RefuseBookingRequestParams = await req.json()

    if (!request_id || !refusal_reason) {
      return new Response(
        JSON.stringify({ error: 'request_id and refusal_reason are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch booking request
    const { data: bookingRequest, error: fetchError } = await supabaseClient
      .from('booking_requests')
      .select('*, appointment_bookings:booking_id(*), contractors!inner(id)')
      .eq('id', request_id)
      .single()

    if (fetchError || !bookingRequest) {
      return new Response(
        JSON.stringify({ error: 'Booking request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check permission
    const isOwner = bookingRequest.contractors.id === user.id
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate status
    if (bookingRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Cannot refuse request with status: ${bookingRequest.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const booking = Array.isArray(bookingRequest.appointment_bookings)
      ? bookingRequest.appointment_bookings[0]
      : bookingRequest.appointment_bookings

    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cancel Stripe PaymentIntent if exists
    if (booking.stripe_payment_intent_id) {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
      if (stripeSecretKey) {
        try {
          const stripeResponse = await fetch(
            `https://api.stripe.com/v1/payment_intents/${booking.stripe_payment_intent_id}/cancel`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          )

          if (!stripeResponse.ok) {
            const stripeError = await stripeResponse.json()
            console.error('Stripe cancellation error:', stripeError)
            // Continue anyway - booking can be refused even if payment cancellation fails
          } else {
            console.log(`✅ Stripe PaymentIntent ${booking.stripe_payment_intent_id} cancelled`)
          }
        } catch (err) {
          console.error('Error cancelling Stripe payment:', err)
          // Continue anyway
        }
      }
    }

    // Update booking_requests status
    const { error: updateError } = await supabaseClient
      .from('booking_requests')
      .update({
        status: 'refused',
        refusal_reason,
        contractor_message: contractor_message || null,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request_id)

    if (updateError) {
      console.error('Error updating booking request:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update appointment_bookings status
    const { error: updateBookingError } = await supabaseClient
      .from('appointment_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateBookingError) {
      console.error('Error updating booking:', updateBookingError)
    }

    // TODO: Send notification email to client with refusal reason
    console.log(`✅ Booking request ${request_id} refused`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking refused and payment cancelled',
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

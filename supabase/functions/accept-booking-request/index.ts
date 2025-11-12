/**
 * Accept Booking Request Edge Function
 * Task: T071
 * Feature: 007-contractor-interface
 *
 * Handles booking acceptance:
 * 1) Update booking_requests.status='accepted'
 * 2) Capture Stripe PaymentIntent
 * 3) Update appointment_bookings.status='confirmed'
 * 4) Send confirmation email to client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AcceptBookingRequestParams {
  request_id: number
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

    const { request_id }: AcceptBookingRequestParams = await req.json()

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: 'request_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch booking request with booking details
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

    // Validate request status
    if (bookingRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Cannot accept request with status: ${bookingRequest.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if expired
    const expiresAt = new Date(bookingRequest.expires_at)
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Request has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const booking = Array.isArray(bookingRequest.appointment_bookings)
      ? bookingRequest.appointment_bookings[0]
      : bookingRequest.appointment_bookings

    if (!booking || !booking.stripe_payment_intent_id) {
      return new Response(
        JSON.stringify({ error: 'Booking or payment intent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Capture Stripe PaymentIntent
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/payment_intents/${booking.stripe_payment_intent_id}/capture`,
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
      console.error('Stripe capture error:', stripeError)
      return new Response(
        JSON.stringify({ error: 'Payment capture failed', details: stripeError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update booking_requests status
    const { error: updateRequestError } = await supabaseClient
      .from('booking_requests')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request_id)

    if (updateRequestError) {
      console.error('Error updating booking request:', updateRequestError)
      return new Response(
        JSON.stringify({ error: 'Failed to update request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update appointment_bookings status
    const { error: updateBookingError } = await supabaseClient
      .from('appointment_bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateBookingError) {
      console.error('Error updating booking:', updateBookingError)
      return new Response(
        JSON.stringify({ error: 'Failed to update booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send confirmation SMS to client
    try {
      // Fetch client and booking details for SMS
      const { data: bookingDetails } = await supabaseClient
        .from('appointment_bookings')
        .select(`
          *,
          services:service_id (name),
          addresses:address_id (street, city, postal_code),
          contractors:contractor_id (
            contractor_profiles!inner (
              business_name,
              profiles!inner (first_name, last_name)
            )
          ),
          clients:client_id (phone)
        `)
        .eq('id', booking.id)
        .single()

      if (bookingDetails?.clients?.phone) {
        // Check if SMS notifications are enabled
        const { data: preferences } = await supabaseClient
          .from('client_notification_preferences')
          .select('sms_enabled, sms_contractor_assignment')
          .eq('client_id', bookingDetails.client_id)
          .single()

        const smsEnabled = preferences?.sms_enabled && preferences?.sms_contractor_assignment !== false

        if (smsEnabled) {
          const contractorProfiles = Array.isArray(bookingDetails.contractors?.contractor_profiles)
            ? bookingDetails.contractors.contractor_profiles[0]
            : bookingDetails.contractors?.contractor_profiles

          const contractorName = contractorProfiles?.business_name ||
            `${contractorProfiles?.profiles?.first_name || ''} ${contractorProfiles?.profiles?.last_name || ''}`.trim()

          // Convert UTC datetime to Paris local time for display
          const scheduledDateTimeUTC = new Date(bookingDetails.scheduled_datetime)
          // Format in Paris timezone (Europe/Paris)
          const dateStr = scheduledDateTimeUTC.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/Paris',
          })
          const timeStr = scheduledDateTimeUTC.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris',
          })

          const message = `Bonne nouvelle! Un professionnel a accepté votre demande.

Professionnel: ${contractorName}
Service: ${bookingDetails.services?.name || 'Service'}
Date: ${dateStr} à ${timeStr}

Consultez votre espace client pour plus de détails.

Simone Paris`

          // Send SMS via Twilio
          const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
          const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
          const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

          if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
            const formData = new URLSearchParams()
            formData.append('To', bookingDetails.clients.phone)
            formData.append('From', twilioPhoneNumber)
            formData.append('Body', message)

            const twilioResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            })

            if (!twilioResponse.ok) {
              console.error('Failed to send SMS:', await twilioResponse.text())
            } else {
              console.log('✅ Confirmation SMS sent to client')
            }
          }
        }
      }
    } catch (smsError) {
      // Log error but don't fail the booking acceptance
      console.error('Error sending confirmation SMS:', smsError)
    }

    // TODO: Send confirmation email to client (via Resend)
    console.log(`✅ Booking request ${request_id} accepted, payment captured`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking accepted and payment captured',
        booking_id: booking.id,
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

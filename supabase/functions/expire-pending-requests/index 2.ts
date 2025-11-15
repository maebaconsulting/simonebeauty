/**
 * Expire Pending Requests Cron Edge Function
 * Task: T074
 * Feature: 007-contractor-interface
 *
 * Automatically expires booking requests where expires_at < NOW() and status='pending'
 * Runs hourly via Supabase cron
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const now = new Date().toISOString()

    // Find expired pending requests
    const { data: expiredRequests, error: fetchError } = await supabaseClient
      .from('booking_requests')
      .select('id, booking_id')
      .eq('status', 'pending')
      .lt('expires_at', now)

    if (fetchError) {
      console.error('Error fetching expired requests:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch requests' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expiredRequests || expiredRequests.length === 0) {
      console.log('✅ No expired requests found')
      return new Response(
        JSON.stringify({ success: true, expired_count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update expired requests
    const { error: updateError } = await supabaseClient
      .from('booking_requests')
      .update({
        status: 'expired',
        updated_at: now,
      })
      .eq('status', 'pending')
      .lt('expires_at', now)

    if (updateError) {
      console.error('Error updating expired requests:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update requests' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Also cancel the associated bookings
    const bookingIds = expiredRequests.map(r => r.booking_id)
    if (bookingIds.length > 0) {
      const { error: cancelError } = await supabaseClient
        .from('appointment_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          updated_at: now,
        })
        .in('id', bookingIds)

      if (cancelError) {
        console.error('Error cancelling bookings:', cancelError)
      }
    }

    console.log(`✅ Expired ${expiredRequests.length} pending requests`)

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredRequests.length,
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

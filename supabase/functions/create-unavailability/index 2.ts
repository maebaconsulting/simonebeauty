/**
 * Create Unavailability Edge Function
 * Task: T059
 * Feature: 007-contractor-interface
 *
 * Creates a new unavailability period for a contractor
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUnavailabilityRequest {
  contractor_id: number
  start_datetime: string // ISO 8601 timestamp
  end_datetime: string // ISO 8601 timestamp
  reason?: string
  reason_type: string // 'vacation' | 'personal' | 'lunch_break' | 'sick' | 'other'
  is_recurring?: boolean
  recurrence_pattern?: string // 'daily' | 'weekly' | 'monthly'
  recurrence_end_date?: string // YYYY-MM-DD format
}

const VALID_REASON_TYPES = ['vacation', 'personal', 'lunch_break', 'sick', 'other']
const VALID_RECURRENCE_PATTERNS = ['daily', 'weekly', 'monthly']

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
    const {
      contractor_id,
      start_datetime,
      end_datetime,
      reason,
      reason_type,
      is_recurring = false,
      recurrence_pattern,
      recurrence_end_date,
    }: CreateUnavailabilityRequest = await req.json()

    // Validate required fields
    if (!contractor_id || !start_datetime || !end_datetime || !reason_type) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: contractor_id, start_datetime, end_datetime, reason_type'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate reason_type
    if (!VALID_REASON_TYPES.includes(reason_type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid reason_type. Must be one of: ${VALID_REASON_TYPES.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate recurrence_pattern if recurring
    if (is_recurring && recurrence_pattern && !VALID_RECURRENCE_PATTERNS.includes(recurrence_pattern)) {
      return new Response(
        JSON.stringify({
          error: `Invalid recurrence_pattern. Must be one of: ${VALID_RECURRENCE_PATTERNS.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate datetime range
    const startDate = new Date(start_datetime)
    const endDate = new Date(end_datetime)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid datetime format. Use ISO 8601 format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (endDate <= startDate) {
      return new Response(
        JSON.stringify({ error: 'end_datetime must be after start_datetime' }),
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
        JSON.stringify({ error: 'Forbidden: You do not have permission to modify this contractor unavailabilities' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create unavailability record
    const { data: newUnavailability, error: insertError } = await supabaseClient
      .from('contractor_unavailabilities')
      .insert({
        contractor_id,
        start_datetime,
        end_datetime,
        reason: reason || null,
        reason_type,
        is_recurring,
        recurrence_pattern: is_recurring ? recurrence_pattern : null,
        recurrence_end_date: is_recurring ? recurrence_end_date : null,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating unavailability:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create unavailability', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Unavailability created:', newUnavailability.id)

    return new Response(
      JSON.stringify({
        success: true,
        unavailability: newUnavailability,
        message: 'Unavailability created successfully',
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

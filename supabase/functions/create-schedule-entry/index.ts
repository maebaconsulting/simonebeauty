/**
 * Create Schedule Entry Edge Function
 * Task: T053
 * Feature: 007-contractor-interface
 *
 * Creates a new schedule entry for a contractor
 * Validates for time overlap before inserting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateScheduleRequest {
  contractor_id: number
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string // HH:MM:SS format
  end_time: string // HH:MM:SS format
  is_recurring?: boolean
  effective_from?: string // YYYY-MM-DD format
  effective_until?: string | null // YYYY-MM-DD format
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
    const {
      contractor_id,
      day_of_week,
      start_time,
      end_time,
      is_recurring = true,
      effective_from,
      effective_until = null,
    }: CreateScheduleRequest = await req.json()

    // Validate required fields
    if (contractor_id === undefined || day_of_week === undefined || !start_time || !end_time) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: contractor_id, day_of_week, start_time, end_time' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate day_of_week range
    if (day_of_week < 0 || day_of_week > 6) {
      return new Response(
        JSON.stringify({ error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' }),
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
        JSON.stringify({ error: 'Forbidden: You do not have permission to modify this contractor schedule' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for time overlaps with existing entries on the same day
    const { data: existingEntries } = await supabaseClient
      .from('contractor_schedules')
      .select('*')
      .eq('contractor_id', contractor_id)
      .eq('day_of_week', day_of_week)
      .eq('is_active', true)

    if (existingEntries && existingEntries.length > 0) {
      // Check for overlaps
      for (const existing of existingEntries) {
        // Simple time overlap check
        const newStart = start_time
        const newEnd = end_time
        const existingStart = existing.start_time
        const existingEnd = existing.end_time

        // Check if ranges overlap: start1 < end2 AND start2 < end1
        if (newStart < existingEnd && existingStart < newEnd) {
          return new Response(
            JSON.stringify({
              error: 'Time range overlaps with existing schedule entry',
              conflicting_entry: {
                id: existing.id,
                start_time: existing.start_time,
                end_time: existing.end_time,
              },
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Create new schedule entry
    const { data: newEntry, error: insertError } = await supabaseClient
      .from('contractor_schedules')
      .insert({
        contractor_id,
        day_of_week,
        start_time,
        end_time,
        is_recurring,
        effective_from: effective_from || new Date().toISOString().split('T')[0],
        effective_until,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating schedule entry:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create schedule entry', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Schedule entry created:', newEntry.id)

    return new Response(
      JSON.stringify({
        success: true,
        schedule: newEntry,
        message: 'Schedule entry created successfully',
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

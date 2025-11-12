/**
 * Update Schedule Entry Edge Function
 * Task: T054
 * Feature: 007-contractor-interface
 *
 * Updates an existing schedule entry
 * Validates for time overlap before updating
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateScheduleRequest {
  schedule_id: number
  start_time?: string // HH:MM:SS format
  end_time?: string // HH:MM:SS format
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
      schedule_id,
      start_time,
      end_time,
      is_recurring,
      effective_from,
      effective_until,
    }: UpdateScheduleRequest = await req.json()

    // Validate required fields
    if (!schedule_id) {
      return new Response(
        JSON.stringify({ error: 'schedule_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch existing schedule entry
    const { data: existingEntry, error: fetchError } = await supabaseClient
      .from('contractor_schedules')
      .select('*, contractors!inner(id)')
      .eq('id', schedule_id)
      .single()

    if (fetchError || !existingEntry) {
      return new Response(
        JSON.stringify({ error: 'Schedule entry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check permission
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = existingEntry.contractors.id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to modify this schedule entry' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring
    if (effective_from !== undefined) updateData.effective_from = effective_from
    if (effective_until !== undefined) updateData.effective_until = effective_until

    // If updating times, check for overlaps
    if (start_time !== undefined || end_time !== undefined) {
      const newStartTime = start_time || existingEntry.start_time
      const newEndTime = end_time || existingEntry.end_time

      // Fetch other entries on the same day
      const { data: otherEntries } = await supabaseClient
        .from('contractor_schedules')
        .select('*')
        .eq('contractor_id', existingEntry.contractor_id)
        .eq('day_of_week', existingEntry.day_of_week)
        .eq('is_active', true)
        .neq('id', schedule_id) // Exclude current entry

      if (otherEntries && otherEntries.length > 0) {
        // Check for overlaps
        for (const other of otherEntries) {
          // Check if ranges overlap: start1 < end2 AND start2 < end1
          if (newStartTime < other.end_time && other.start_time < newEndTime) {
            return new Response(
              JSON.stringify({
                error: 'Time range would overlap with another schedule entry',
                conflicting_entry: {
                  id: other.id,
                  start_time: other.start_time,
                  end_time: other.end_time,
                },
              }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      }
    }

    // Update schedule entry
    const { data: updated, error: updateError } = await supabaseClient
      .from('contractor_schedules')
      .update(updateData)
      .eq('id', schedule_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating schedule entry:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update schedule entry', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Schedule entry updated:', updated.id)

    return new Response(
      JSON.stringify({
        success: true,
        schedule: updated,
        message: 'Schedule entry updated successfully',
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

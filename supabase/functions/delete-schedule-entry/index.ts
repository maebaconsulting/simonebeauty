/**
 * Delete Schedule Entry Edge Function
 * Task: T055
 * Feature: 007-contractor-interface
 *
 * Soft deletes a schedule entry (sets is_active = false)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteScheduleRequest {
  schedule_id: number
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
    const { schedule_id }: DeleteScheduleRequest = await req.json()

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
        JSON.stringify({ error: 'Forbidden: You do not have permission to delete this schedule entry' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Soft delete: set is_active = false
    const { data: deleted, error: deleteError } = await supabaseClient
      .from('contractor_schedules')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule_id)
      .select()
      .single()

    if (deleteError) {
      console.error('Error deleting schedule entry:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete schedule entry', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Schedule entry deleted (soft):', deleted.id)

    return new Response(
      JSON.stringify({
        success: true,
        schedule: deleted,
        message: 'Schedule entry deleted successfully',
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

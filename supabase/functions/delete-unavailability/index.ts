/**
 * Delete Unavailability Edge Function
 * Task: T060
 * Feature: 007-contractor-interface
 *
 * Soft deletes an unavailability period (sets is_active = false)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUnavailabilityRequest {
  unavailability_id: number
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
    const { unavailability_id }: DeleteUnavailabilityRequest = await req.json()

    // Validate required fields
    if (!unavailability_id) {
      return new Response(
        JSON.stringify({ error: 'unavailability_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch existing unavailability
    const { data: existingUnavailability, error: fetchError } = await supabaseClient
      .from('contractor_unavailabilities')
      .select('*, contractors!inner(id)')
      .eq('id', unavailability_id)
      .single()

    if (fetchError || !existingUnavailability) {
      return new Response(
        JSON.stringify({ error: 'Unavailability not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check permission
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = existingUnavailability.contractors.id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to delete this unavailability' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Soft delete: set is_active = false
    const { data: deleted, error: deleteError } = await supabaseClient
      .from('contractor_unavailabilities')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unavailability_id)
      .select()
      .single()

    if (deleteError) {
      console.error('Error deleting unavailability:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete unavailability', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Unavailability deleted (soft):', deleted.id)

    return new Response(
      JSON.stringify({
        success: true,
        unavailability: deleted,
        message: 'Unavailability deleted successfully',
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

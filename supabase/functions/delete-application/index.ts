/**
 * Delete Contractor Application Edge Function
 * Task: T038 - Delete rejected contractor applications with file cleanup
 * Feature: 007-contractor-interface
 * Requirement: FR-020a
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteApplicationRequest {
  applicationId: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for file deletion
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get authorization header for user verification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is authenticated and admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { applicationId }: DeleteApplicationRequest = await req.json()

    // Validate input
    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'Missing applicationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get application details to verify status and get file paths
    const { data: application, error: fetchError } = await supabaseClient
      .from('contractor_applications')
      .select('id, status, cv_file_path, certifications_file_paths, portfolio_file_paths')
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Verify application is rejected (per FR-020a)
    if (application.status !== 'rejected') {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete application',
          details: 'Only rejected applications can be deleted. Current status: ' + application.status
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Collect all file paths to delete
    const filesToDelete: string[] = []

    if (application.cv_file_path) {
      filesToDelete.push(application.cv_file_path)
    }

    if (application.certifications_file_paths && Array.isArray(application.certifications_file_paths)) {
      filesToDelete.push(...application.certifications_file_paths)
    }

    if (application.portfolio_file_paths && Array.isArray(application.portfolio_file_paths)) {
      filesToDelete.push(...application.portfolio_file_paths)
    }

    // Delete files from storage
    const deletionResults = {
      filesDeleted: 0,
      filesNotFound: 0,
      deletionErrors: [] as string[]
    }

    for (const filePath of filesToDelete) {
      try {
        // Determine bucket based on file path prefix
        let bucket = 'contractor-applications'

        // File paths are typically stored as "bucket/path/to/file.ext"
        // Extract the path within the bucket
        const pathParts = filePath.split('/')
        if (pathParts.length > 1 && (pathParts[0] === 'cv' || pathParts[0] === 'certifications' || pathParts[0] === 'portfolio')) {
          // Path is relative within the bucket, use as-is
        } else {
          // Path might include bucket name, extract it
          bucket = pathParts[0]
          filePath = pathParts.slice(1).join('/')
        }

        const { error: deleteError } = await supabaseClient.storage
          .from(bucket)
          .remove([filePath])

        if (deleteError) {
          if (deleteError.message.includes('not found')) {
            deletionResults.filesNotFound++
          } else {
            console.error(`Error deleting file ${filePath}:`, deleteError)
            deletionResults.deletionErrors.push(`${filePath}: ${deleteError.message}`)
          }
        } else {
          deletionResults.filesDeleted++
        }
      } catch (error) {
        console.error(`Exception deleting file ${filePath}:`, error)
        deletionResults.deletionErrors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Delete application record (RLS policy will enforce admin + rejected status)
    const { error: deleteError } = await supabaseClient
      .from('contractor_applications')
      .delete()
      .eq('id', applicationId)

    if (deleteError) {
      console.error('Error deleting application:', deleteError)
      return new Response(
        JSON.stringify({
          error: 'Failed to delete application',
          details: deleteError.message,
          code: deleteError.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application deleted successfully',
        applicationId,
        filesDeleted: deletionResults.filesDeleted,
        filesNotFound: deletionResults.filesNotFound,
        deletionErrors: deletionResults.deletionErrors.length > 0 ? deletionResults.deletionErrors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

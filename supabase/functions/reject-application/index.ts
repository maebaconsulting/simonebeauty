/**
 * Reject Application Edge Function
 * Task: T041 - Update status, archive, and send rejection email
 * Feature: 007-contractor-interface
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RejectApplicationRequest {
  applicationId: number
  rejectionReason: string
  sendEmail?: boolean
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
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

    // Get request body
    const { applicationId, rejectionReason, sendEmail = true }: RejectApplicationRequest = await req.json()

    // Validate input
    if (!applicationId || !rejectionReason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (rejectionReason.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Rejection reason too short (minimum 10 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get application details
    const { data: application, error: fetchError } = await supabaseClient
      .from('contractor_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already rejected
    if (application.status === 'rejected') {
      return new Response(
        JSON.stringify({ error: 'Application already rejected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update application status
    const { error: updateError } = await supabaseClient
      .from('contractor_applications')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update application' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send rejection email
    if (sendEmail) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

      if (RESEND_API_KEY) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Simone Paris <noreply@simone.paris>',
            to: [application.email],
            subject: 'Suite à votre candidature - Simone Paris',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1f2937;">Bonjour ${application.first_name},</h1>

                <p>Nous vous remercions sincèrement d'avoir pris le temps de déposer votre candidature pour rejoindre notre réseau de prestataires Simone Paris.</p>

                <p>Après avoir étudié votre profil avec attention, nous sommes au regret de vous informer que nous ne pouvons pas donner suite favorable à votre demande pour le moment.</p>

                <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #374151;">Raison</h3>
                  <p style="margin: 0; color: #4b5563; line-height: 1.6;">${rejectionReason}</p>
                </div>

                <p>Cette décision ne remet en aucun cas en question vos compétences professionnelles. Les critères de sélection sont basés sur nos besoins actuels et la configuration de notre réseau.</p>

                <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">Prochaines étapes possibles</h3>
                  <ul style="margin: 8px 0; padding-left: 20px; color: #1e40af;">
                    <li>Vous pouvez renouveler votre candidature dans quelques mois</li>
                    <li>N'hésitez pas à nous contacter si vous souhaitez des précisions</li>
                    <li>Nous conservons votre dossier pour de futures opportunités</li>
                  </ul>
                </div>

                <p>Nous vous souhaitons beaucoup de réussite dans vos projets professionnels et espérons avoir l'opportunité de collaborer avec vous à l'avenir.</p>

                <p style="margin-top: 32px;">Cordialement,<br>
                <strong>L'équipe Simone Paris</strong></p>

                <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                  Cet email est envoyé automatiquement, merci de ne pas y répondre directement.<br>
                  Pour toute question, contactez-nous via notre site web.
                </p>
              </div>
            `,
          }),
        })

        if (!emailResponse.ok) {
          console.error('Error sending email:', await emailResponse.text())
          // Don't fail the whole operation if email fails
        }
      }
    }

    // Create notification for admin (optional - for audit trail)
    // This could be logged to a notifications table or sent to a Slack channel

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application rejected successfully',
        applicationId,
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

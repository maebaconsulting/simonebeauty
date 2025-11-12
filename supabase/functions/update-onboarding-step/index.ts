/**
 * Update Onboarding Step Edge Function
 * Task: T048 - Handle individual step completion
 * Feature: 007-contractor-interface
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateOnboardingStepRequest {
  contractorId: number
  step: 'schedule' | 'stripe' | 'profile'
  data?: any
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
    const { contractorId, step, data }: UpdateOnboardingStepRequest = await req.json()

    // Validate input
    if (!contractorId || !step) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine which boolean to update
    let updateField: string
    let additionalUpdates: any = {}

    switch (step) {
      case 'schedule':
        updateField = 'schedule_configured'
        // No additional data needed for schedule
        break

      case 'stripe':
        updateField = 'stripe_connected'
        // Stripe connection is handled by webhook, but we mark it as true here if manually triggered
        break

      case 'profile':
        updateField = 'profile_completed'

        // Update contractor_profiles with profile data
        if (data) {
          const { bio, professional_title, years_of_experience, specialties } = data

          const { error: profileError } = await supabaseClient
            .from('contractor_profiles')
            .update({
              bio,
              professional_title,
              years_of_experience,
            })
            .eq('contractor_id', contractorId)

          if (profileError) {
            console.error('Error updating contractor profile:', profileError)
          }

          // Update contractor_profile_specialties (clear existing and add new)
          if (specialties && Array.isArray(specialties)) {
            // Delete existing specialties
            await supabaseClient
              .from('contractor_profile_specialties')
              .delete()
              .eq('contractor_profile_id', contractorId)

            // Insert new specialties
            const specialtyInserts = specialties.map((specialtyId: number) => ({
              contractor_profile_id: contractorId,
              specialty_id: specialtyId,
            }))

            if (specialtyInserts.length > 0) {
              await supabaseClient
                .from('contractor_profile_specialties')
                .insert(specialtyInserts)
            }
          }
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid step' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Update onboarding status
    const { data: updated, error: updateError } = await supabaseClient
      .from('contractor_onboarding_status')
      .update({
        [updateField]: true,
        ...additionalUpdates,
      })
      .eq('contractor_id', contractorId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating onboarding status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update onboarding status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if onboarding is now complete
    const { data: status } = await supabaseClient
      .from('contractor_onboarding_status')
      .select('*')
      .eq('contractor_id', contractorId)
      .single()

    let completionMessage = `Step ${step} completed`

    // If all steps are now complete, the trigger will handle setting completed_at
    if (status && status.is_completed) {
      completionMessage = 'Onboarding completed! Welcome to Simone Paris.'

      // Send completion email
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

      if (RESEND_API_KEY) {
        // Get contractor details for email
        const { data: contractor } = await supabaseClient
          .from('contractors')
          .select('id')
          .eq('id', contractorId)
          .single()

        if (contractor) {
          const { data: { user } } = await supabaseClient.auth.admin.getUserById(contractor.id)

          if (user && user.email) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Simone Paris <noreply@simone.paris>',
                to: [user.email],
                subject: '🎉 Onboarding complété - Vous êtes prêt !',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #16a34a;">Félicitations ! 🎉</h1>

                    <p>Vous avez complété votre onboarding avec succès. Vous êtes maintenant prêt à recevoir vos premières demandes de clients !</p>

                    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0;">
                      <h2 style="margin-top: 0; color: #15803d;">Prochaines étapes</h2>
                      <ol style="margin: 8px 0; padding-left: 20px;">
                        <li>Consultez votre tableau de bord pour voir les demandes en attente</li>
                        <li>Configurez vos préférences de notification</li>
                        <li>Partagez votre lien de réservation personnalisé</li>
                      </ol>
                    </div>

                    <a href="${Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000'}/contractor/dashboard"
                       style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                      Accéder à mon espace
                    </a>

                    <p style="margin-top: 32px;">Bienvenue dans l'équipe !<br>
                    <strong>L'équipe Simone Paris</strong></p>
                  </div>
                `,
              }),
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: completionMessage,
        onboardingStatus: status,
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

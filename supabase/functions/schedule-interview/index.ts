/**
 * Schedule Interview Edge Function
 * Task: T037 - Update application status and send calendar invite
 * Feature: 007-contractor-interface
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleInterviewRequest {
  applicationId: number
  interviewDate: string
  interviewMode: 'video' | 'phone' | 'in_person'
  interviewNotes?: string
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
    const { applicationId, interviewDate, interviewMode, interviewNotes }: ScheduleInterviewRequest = await req.json()

    // Validate input
    if (!applicationId || !interviewDate || !interviewMode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Update application status
    const { error: updateError } = await supabaseClient
      .from('contractor_applications')
      .update({
        status: 'interview_scheduled',
        interview_date: interviewDate,
        interview_mode: interviewMode,
        interview_notes: interviewNotes || null,
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

    // Generate ICS calendar invite
    const icsContent = generateICS({
      summary: `Entretien Simone Paris - ${application.first_name} ${application.last_name}`,
      description: `Entretien ${interviewMode === 'video' ? 'en visioconférence' : interviewMode === 'phone' ? 'téléphonique' : 'en personne'} avec ${application.first_name} ${application.last_name}${interviewNotes ? `\n\nNotes: ${interviewNotes}` : ''}`,
      startDate: new Date(interviewDate),
      duration: 60, // 1 hour
      location: interviewMode === 'in_person' ? 'Bureau Simone Paris' : interviewMode === 'video' ? 'Lien visio (sera communiqué)' : 'Téléphone',
    })

    // Send email with calendar invite using Resend
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
          subject: '📅 Entretien planifié - Simone Paris',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Bonjour ${application.first_name},</h1>

              <p>Nous avons le plaisir de vous informer qu'un entretien a été planifié pour discuter de votre candidature chez Simone Paris.</p>

              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
                <h2 style="margin-top: 0; color: #1e40af;">Détails de l'entretien</h2>
                <p style="margin: 8px 0;"><strong>Date et heure :</strong> ${new Date(interviewDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p style="margin: 8px 0;"><strong>Mode :</strong> ${
                  interviewMode === 'video' ? 'Visioconférence (le lien vous sera communiqué)' :
                  interviewMode === 'phone' ? 'Entretien téléphonique' :
                  'En personne'
                }</p>
                ${interviewNotes ? `<p style="margin: 8px 0;"><strong>Notes :</strong> ${interviewNotes}</p>` : ''}
              </div>

              <p>Un événement calendrier est joint à cet email pour vous permettre de l'ajouter facilement à votre agenda.</p>

              <p>Si vous avez des questions ou si vous ne pouvez pas vous rendre disponible à cette date, merci de nous contacter au plus vite.</p>

              <p style="margin-top: 32px;">À très bientôt,<br>
              <strong>L'équipe Simone Paris</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: 'entretien.ics',
              content: base64Encode(new TextEncoder().encode(icsContent)),
              content_type: 'text/calendar; method=REQUEST; charset=utf-8',
            }
          ],
        }),
      })

      if (!emailResponse.ok) {
        console.error('Error sending email:', await emailResponse.text())
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Interview scheduled successfully',
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

/**
 * Generate ICS calendar file content
 */
function generateICS(params: {
  summary: string
  description: string
  startDate: Date
  duration: number
  location: string
}): string {
  const { summary, description, startDate, duration, location } = params

  const endDate = new Date(startDate.getTime() + duration * 60 * 1000)

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Simone Paris//Interview Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:interview-${Date.now()}@simone.paris
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${summary}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Rappel: ${summary}
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`
}

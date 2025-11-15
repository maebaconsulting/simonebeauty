/**
 * Edge Function: Submit Job Application
 * Task: T031
 *
 * Handles contractor application submission:
 * 1. Upload files to Supabase Storage
 * 2. Insert application record in database
 * 3. Create backoffice task
 * 4. Send confirmation emails (candidate + admin)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApplicationData {
  // Step 1
  first_name: string
  last_name: string
  email: string
  phone: string
  contractor_type?: string
  street_address?: string
  city?: string
  postal_code?: string
  country: string

  // Step 2
  profession: string
  years_of_experience: number
  diplomas?: string
  specialties: number[]
  services_offered: string

  // Step 3
  geographic_zones: string[]
  weekly_availability?: Record<string, {
    available: boolean
    shifts: Array<{ start: string; end: string }>
    breaks?: Array<{ start: string; end: string }>
  }>
  work_frequency: string

  // Step 4
  motivation?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    )

    // Parse multipart form data
    const formData = await req.formData()

    // Extract application data
    const applicationData: ApplicationData = JSON.parse(formData.get('data') as string)

    console.log('📋 Processing application for:', applicationData.email)

    // Upload files if present
    const cvFilePath = await uploadFileIfPresent(
      supabaseClient,
      formData.get('cv_file') as File,
      'job-applications',
      'cv'
    )

    const certificationsPaths = await uploadMultipleFiles(
      supabaseClient,
      formData.getAll('certifications_files') as File[],
      'job-applications',
      'certifications'
    )

    const portfolioPaths = await uploadMultipleFiles(
      supabaseClient,
      formData.getAll('portfolio_files') as File[],
      'job-applications',
      'portfolio'
    )

    console.log('📁 Files uploaded:', { cvFilePath, certificationsPaths, portfolioPaths })

    // Insert application into database
    const { data: application, error: applicationError } = await supabaseClient
      .from('contractor_applications')
      .insert({
        ...applicationData,
        cv_file_path: cvFilePath,
        certifications_file_paths: certificationsPaths,
        portfolio_file_paths: portfolioPaths,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (applicationError) {
      console.error('❌ Application insert error:', applicationError)
      throw new Error(`Database error: ${applicationError.message}`)
    }

    console.log('✅ Application created:', application.id)

    // Create backoffice task
    const { error: taskError } = await supabaseClient
      .from('backoffice_tasks')
      .insert({
        type: 'job_application',
        priority: 'medium',
        status: 'pending',
        title: `Nouvelle candidature: ${applicationData.first_name} ${applicationData.last_name}`,
        description: `Candidature pour ${applicationData.profession}`,
        metadata: {
          application_id: application.id,
          email: applicationData.email,
        },
      })

    if (taskError) {
      console.error('⚠️ Task creation error:', taskError)
      // Non-blocking error
    }

    // Send confirmation email to candidate
    await sendCandidateEmail(applicationData)

    // Send notification email to admin team
    await sendAdminEmail(applicationData, application.id)

    return new Response(
      JSON.stringify({
        success: true,
        application_id: application.id,
        message: 'Candidature soumise avec succès',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Upload a single file to Supabase Storage
 */
async function uploadFileIfPresent(
  supabase: any,
  file: File | null,
  bucket: string,
  folder: string
): Promise<string | null> {
  if (!file) return null

  const timestamp = Date.now()
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`File upload failed: ${error.message}`)
  }

  return data.path
}

/**
 * Upload multiple files to Supabase Storage
 */
async function uploadMultipleFiles(
  supabase: any,
  files: File[],
  bucket: string,
  folder: string
): Promise<string[]> {
  if (!files || files.length === 0) return []

  const uploadPromises = files.map(file => uploadFileIfPresent(supabase, file, bucket, folder))
  const results = await Promise.all(uploadPromises)

  return results.filter(path => path !== null) as string[]
}

/**
 * Send confirmation email to candidate
 */
async function sendCandidateEmail(data: ApplicationData) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured, skipping candidate email')
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Simone Paris <noreply@simone.paris>',
      to: [data.email],
      subject: 'Candidature reçue - Simone Paris',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #9333ea;">Merci pour votre candidature !</h1>

          <p>Bonjour ${data.first_name},</p>

          <p>Nous avons bien reçu votre candidature pour rejoindre notre réseau de prestataires.</p>

          <h2 style="color: #333;">Récapitulatif de votre candidature :</h2>
          <ul>
            <li><strong>Profession :</strong> ${data.profession}</li>
            <li><strong>Expérience :</strong> ${data.years_of_experience} ans</li>
            <li><strong>Zones d'intervention :</strong> ${data.geographic_zones.join(', ')}</li>
          </ul>

          <h3>Prochaines étapes :</h3>
          <ol>
            <li>Notre équipe va étudier votre profil (sous 2-3 jours ouvrés)</li>
            <li>Si votre profil correspond, nous vous contacterons pour planifier un entretien</li>
            <li>Suite à l'entretien, nous validerons votre compte et vous recevrez vos identifiants</li>
          </ol>

          <p>Nous vous recontacterons très prochainement.</p>

          <p>Cordialement,<br>L'équipe Simone Paris</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    console.error('❌ Resend error:', await response.text())
  } else {
    console.log('✅ Candidate email sent to:', data.email)
  }
}

/**
 * Send notification email to admin team
 */
async function sendAdminEmail(data: ApplicationData, applicationId: number) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured, skipping admin email')
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Simone Paris <noreply@simone.paris>',
      to: ['contact@simone.paris'],
      subject: `Nouvelle candidature: ${data.first_name} ${data.last_name} (${data.profession})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #9333ea;">Nouvelle candidature prestataire</h1>

          <h2>Informations candidat :</h2>
          <ul>
            <li><strong>Nom :</strong> ${data.first_name} ${data.last_name}</li>
            <li><strong>Email :</strong> ${data.email}</li>
            <li><strong>Téléphone :</strong> ${data.phone}</li>
            ${data.contractor_type ? `<li><strong>Type de structure :</strong> ${data.contractor_type}</li>` : ''}
            ${data.street_address || data.city || data.postal_code ? `
              <li><strong>Adresse :</strong>
                ${data.street_address || ''}${data.street_address && (data.city || data.postal_code) ? ', ' : ''}
                ${data.postal_code || ''} ${data.city || ''}, ${data.country}
              </li>
            ` : ''}
          </ul>

          <h2>Profil professionnel :</h2>
          <ul>
            <li><strong>Profession :</strong> ${data.profession}</li>
            <li><strong>Expérience :</strong> ${data.years_of_experience} ans</li>
            <li><strong>Diplômes :</strong> ${data.diplomas || 'Non renseignés'}</li>
            <li><strong>Services proposés :</strong> ${data.services_offered}</li>
          </ul>

          <h2>Disponibilités :</h2>
          <ul>
            <li><strong>Zones :</strong> ${data.geographic_zones.join(', ')}</li>
            <li><strong>Fréquence :</strong> ${data.work_frequency}</li>
          </ul>

          ${data.weekly_availability && Object.keys(data.weekly_availability).length > 0 ? `
            <h3 style="margin-top: 15px;">Planning hebdomadaire :</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr style="background: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Jour</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Créneaux</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Pauses</th>
              </tr>
              ${Object.entries(data.weekly_availability)
                .filter(([_, dayData]) => dayData.available)
                .map(([day, dayData]) => {
                  const dayLabels = {
                    monday: 'Lundi',
                    tuesday: 'Mardi',
                    wednesday: 'Mercredi',
                    thursday: 'Jeudi',
                    friday: 'Vendredi',
                    saturday: 'Samedi',
                    sunday: 'Dimanche'
                  };
                  return `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;"><strong>${dayLabels[day] || day}</strong></td>
                      <td style="border: 1px solid #ddd; padding: 8px;">
                        ${dayData.shifts.map(shift => `${shift.start} - ${shift.end}`).join('<br>')}
                      </td>
                      <td style="border: 1px solid #ddd; padding: 8px;">
                        ${dayData.breaks && dayData.breaks.length > 0
                          ? dayData.breaks.map(breakSlot => `${breakSlot.start} - ${breakSlot.end}`).join('<br>')
                          : '-'
                        }
                      </td>
                    </tr>
                  `;
                }).join('')}
            </table>
          ` : '<p style="color: #666;"><em>Aucun horaire hebdomadaire fourni</em></p>'}

          ${data.motivation ? `
            <h2>Motivation :</h2>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              ${data.motivation}
            </p>
          ` : '<p style="color: #666;"><em>Aucune lettre de motivation fournie</em></p>'}

          <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
            <p><strong>Action requise :</strong></p>
            <p>
              <a href="${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/admin/contractors/applications/${applicationId}"
                 style="display: inline-block; padding: 12px 24px; background: #9333ea; color: white; text-decoration: none; border-radius: 6px;">
                Consulter la candidature
              </a>
            </p>
          </div>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    console.error('❌ Resend error:', await response.text())
  } else {
    console.log('✅ Admin email sent')
  }
}

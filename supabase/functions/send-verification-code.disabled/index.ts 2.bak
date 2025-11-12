// Edge Function: send-verification-code
// Description: Generates and sends 6-digit verification code via email
// Author: Spec 001 - Authentication System
// Requires: RESEND_API_KEY environment variable

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  email: string
  type: 'email_verification' | 'password_reset'
  userId?: string // Optional: if called during signup before user is authenticated
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, type, userId }: RequestBody = await req.json()

    // Validate input
    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: 'Email and type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get user ID from auth if not provided
    let targetUserId = userId
    if (!targetUserId) {
      const authHeader = req.headers.get('Authorization')!
      const jwt = authHeader.replace('Bearer ', '')
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(jwt)
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      targetUserId = user.id
    }

    // Generate cryptographically secure 6-digit code
    const code = crypto
      .getRandomValues(new Uint32Array(1))[0]
      .toString()
      .slice(0, 6)
      .padStart(6, '0')

    // Store code in database
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minute expiration

    const { error: dbError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        user_id: targetUserId,
        code,
        type,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to store verification code' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const emailSubject =
      type === 'email_verification'
        ? 'Code de vérification Simone Paris'
        : 'Réinitialisation de mot de passe Simone Paris'

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Simone Paris</h1>
          </div>

          <div style="background: #f9f9f9; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px 0;">
              ${type === 'email_verification' ? 'Votre code de vérification' : 'Réinitialisation de mot de passe'}
            </h2>

            <p style="color: #666; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
              ${
                type === 'email_verification'
                  ? 'Merci de votre inscription ! Utilisez le code ci-dessous pour vérifier votre adresse email :'
                  : 'Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code ci-dessous :'
              }
            </p>

            <div style="background: white; border: 2px solid #e0e0e0; border-radius: 8px; padding: 24px; text-align: center;">
              <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>

            <p style="color: #999; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
              Ce code expire dans 15 minutes.
            </p>
          </div>

          <div style="border-top: 1px solid #e0e0e0; padding-top: 24px;">
            <p style="color: #999; font-size: 14px; margin: 0; text-align: center;">
              Si vous n'avez pas demandé ce code, ignorez cet email.
            </p>
          </div>
        </body>
      </html>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Simone Paris <noreply@simoneparis.fr>',
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend API error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent successfully',
        expiresAt: expiresAt.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

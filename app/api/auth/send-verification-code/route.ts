// API Route: Send Verification Code (Temporary workaround for Edge Function issues)
// This route will be used until Edge Function deployment is fully working
// TODO: Switch back to Edge Function once deployment issues are resolved

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface RequestBody {
  email: string
  type: 'email_verification' | 'password_reset'
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { email, type, userId } = body

    // Validate input
    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      )
    }

    // Create Supabase admin client (server-side only)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
      // For both password reset and email verification, lookup user by email
      // This allows the flow to work even when user doesn't have a valid session yet
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()

      const user = userData?.users?.find(u => u.email === email)

      if (!user) {
        // For security: don't reveal if email exists or not
        // Return success but don't actually send email
        return NextResponse.json({
          success: true,
          message: 'Si cette adresse email existe, un code a été envoyé',
        })
      }
      targetUserId = user.id
    }

    // Generate cryptographically secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

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
      return NextResponse.json(
        { error: 'Failed to store verification code', details: dbError.message },
        { status: 500 }
      )
    }

    // Send email using Resend
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

    try {
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Simone Paris <noreply@simone.paris>',
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      })
      console.log('✅ Email sent successfully to:', email)
      console.log('📧 Email result:', JSON.stringify(emailResult, null, 2))
    } catch (emailError: any) {
      console.error('❌ Resend error:', emailError)
      console.error('❌ Error details:', JSON.stringify(emailError, null, 2))
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Function error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

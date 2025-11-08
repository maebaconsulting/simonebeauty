// API Route: Verify Verification Code
// Verifies if a 6-digit code is valid and not expired

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

interface RequestBody {
  userId: string
  code: string
  type: 'email_verification' | 'password_reset'
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { userId, code, type } = body

    // Validate input
    if (!userId || !code || !type) {
      return NextResponse.json(
        { error: 'userId, code et type sont requis' },
        { status: 400 }
      )
    }

    // Find the verification code
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du code' },
        { status: 500 }
      )
    }

    if (!codes || codes.length === 0) {
      return NextResponse.json(
        { error: 'Code incorrect' },
        { status: 400 }
      )
    }

    const verificationCode = codes[0]

    // Check if code is expired
    const now = new Date()
    const expiresAt = new Date(verificationCode.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Code expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Check attempts
    if (verificationCode.attempts >= 3) {
      return NextResponse.json(
        { error: 'Maximum de tentatives atteint. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Code is valid - increment attempts (will be deleted after successful use)
    const { error: updateError } = await supabaseAdmin
      .from('verification_codes')
      .update({ attempts: verificationCode.attempts + 1 })
      .eq('id', verificationCode.id)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    // If email verification, update profile
    if (type === 'email_verification') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }
    }

    // Delete the used code
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('id', verificationCode.id)

    return NextResponse.json({
      success: true,
      message: 'Code vérifié avec succès',
    })
  } catch (error: any) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

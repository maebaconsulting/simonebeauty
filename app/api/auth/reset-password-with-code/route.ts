// API Route: Reset Password With Code
// Complete password reset flow: lookup user + verify code + update password

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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
  email: string
  code: string
  newPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { email, code, newPassword } = body

    // Validate input
    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code et nouveau mot de passe sont requis' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Step 1: Find user by email
    const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('List users error:', listError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      )
    }

    const user = userData?.users?.find(u => u.email === email)

    if (!user) {
      // For security: return generic error
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 400 }
      )
    }

    // Step 2: Verify the code
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', code)
      .eq('type', 'password_reset')
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
        { error: 'Code invalide ou expiré' },
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

    // Step 3: Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      )
    }

    // Step 3.5: Re-confirm email if user was previously verified
    // This fixes the bug where password reset causes verified users to be asked to verify email again
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email_verified')
      .eq('id', user.id)
      .single()

    if (profile?.email_verified) {
      // User had verified their email before - re-confirm it in auth.users
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      )
    }

    // Step 4: Delete the used code
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('id', verificationCode.id)

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error: any) {
    console.error('Reset password with code error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

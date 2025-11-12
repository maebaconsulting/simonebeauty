// API Route: Reset Password
// Updates user password after code verification

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
  newPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { userId, newPassword } = body

    // Validate input
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'userId et newPassword sont requis' },
        { status: 400 }
      )
    }

    // Validate password strength (same as signup)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      )
    }

    // Re-confirm email if user was previously verified
    // This fixes the bug where password reset causes verified users to be asked to verify email again
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email_verified')
      .eq('id', userId)
      .single()

    if (profile?.email_verified) {
      // User had verified their email before - re-confirm it in auth.users
      await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

// API Route: Verify Code By Email
// Verifies code when user is not authenticated yet (signup flow)

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
  type: 'email_verification' | 'password_reset'
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { email, code, type } = body

    // Validate input
    if (!email || !code || !type) {
      return NextResponse.json(
        { error: 'Email, code et type sont requis' },
        { status: 400 }
      )
    }

    // Step 1: Find user by email
    const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('List users error:', listError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification' },
        { status: 500 }
      )
    }

    const user = userData?.users?.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 400 }
      )
    }

    // Step 2: Find the verification code
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
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

    // Step 3: Check if code is expired
    const now = new Date()
    const expiresAt = new Date(verificationCode.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Code expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Step 4: Check attempts
    if (verificationCode.attempts >= 3) {
      return NextResponse.json(
        { error: 'Maximum de tentatives atteint. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Step 5: Code is valid!
    // Update profile to mark email as verified
    if (type === 'email_verification') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      // Update auth.users to confirm email
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      )

      if (confirmError) {
        console.error('Email confirm error:', confirmError)
      }
    }

    // Step 6: Delete the used code
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('id', verificationCode.id)

    return NextResponse.json({
      success: true,
      message: 'Code vérifié avec succès',
    })
  } catch (error: any) {
    console.error('Verify code by email error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

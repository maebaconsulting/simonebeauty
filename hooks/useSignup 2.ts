import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SignupData } from '@/types/auth'

interface SignupResponse {
  userId: string
  email: string
  message: string
}

interface SignupError {
  message: string
  type?: string
}

/**
 * Hook for user signup with email verification
 * Steps:
 * 1. Create user in Supabase Auth
 * 2. Trigger Edge Function to send verification code
 * 3. Return userId for verification step
 */
export function useSignup() {
  const supabase = createClient()

  return useMutation<SignupResponse, SignupError, SignupData>({
    mutationFn: async (data: SignupData) => {
      const { email, password, first_name, last_name } = data

      // Step 1: Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
          },
          emailRedirectTo: undefined, // We're using custom verification codes, not magic links
          // IMPORTANT: Must disable email confirmation in Supabase Dashboard
          // Dashboard > Auth > Settings > Enable email confirmations = OFF
        },
      })

      if (authError) {
        // Map Supabase errors to user-friendly messages
        if (authError.message.includes('already registered')) {
          throw {
            message: 'Cette adresse email est déjà utilisée',
            type: 'email_already_exists',
          }
        }
        throw {
          message: authError.message || 'Erreur lors de l\'inscription',
          type: 'signup_error',
        }
      }

      if (!authData.user) {
        throw {
          message: 'Erreur lors de la création du compte',
          type: 'signup_error',
        }
      }

      // Step 2: Update profile with names (trigger should have created basic profile)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name,
          last_name,
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // Non-blocking: profile will exist but without names
      }

      // Step 3: Send verification code via API route (temporary workaround)
      // TODO: Switch back to Edge Function once deployment issues are resolved
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: 'email_verification',
          userId: authData.user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Verification code send error:', errorData)
        throw {
          message: 'Compte créé mais l\'envoi du code de vérification a échoué. Veuillez demander un nouveau code.',
          type: 'verification_send_error',
        }
      }

      return {
        userId: authData.user.id,
        email: authData.user.email!,
        message: 'Un code de vérification a été envoyé à votre adresse email',
      }
    },
  })
}

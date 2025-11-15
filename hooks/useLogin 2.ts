import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LoginCredentials } from '@/types/auth'

interface LoginResponse {
  success: boolean
  message: string
  redirectTo: string
}

interface LoginError {
  message: string
  type?: string
}

/**
 * Hook for user login with email and password
 * Handles:
 * - Authentication via Supabase
 * - Email verification check
 * - Role-based redirection
 * - Last login timestamp update
 */
export function useLogin() {
  const supabase = createClient()

  return useMutation<LoginResponse, LoginError, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const { email, password } = credentials

      // Attempt login with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Generic error message to prevent email enumeration
        throw {
          message: 'Email ou mot de passe incorrect',
          type: 'invalid_credentials',
        }
      }

      if (!authData.user) {
        throw {
          message: 'Erreur lors de la connexion',
          type: 'login_error',
        }
      }

      // Fetch user profile via API route (bypasses RLS issues)
      const profileResponse = await fetch(`/api/auth/get-profile?userId=${authData.user.id}`)

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({}))
        console.error('Profile fetch error:', errorData)
        console.error('User ID:', authData.user.id)

        throw {
          message: 'Erreur lors de la récupération du profil',
          type: 'profile_error',
          details: errorData.details || errorData.error,
        }
      }

      const { profile } = await profileResponse.json()

      if (!profile) {
        throw {
          message: 'Profil introuvable',
          type: 'profile_not_found',
        }
      }

      return processLogin(profile, authData.user.id, supabase)
    },
  })
}

async function processLogin(
  profile: { email_verified: boolean; role: string; is_active: boolean },
  userId: string,
  supabase: any
): Promise<LoginResponse> {
  // Check if account is active
  if (!profile.is_active) {
    // Sign out if account is disabled
    await supabase.auth.signOut()
    throw {
      message: 'Votre compte a été désactivé. Contactez le support.',
      type: 'account_disabled',
    }
  }

  // Check if email is verified
  if (!profile.email_verified) {
    throw {
      message: 'Veuillez vérifier votre email avant de vous connecter',
      type: 'account_not_verified',
    }
  }

  // Update last_login_at timestamp
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    console.error('Last login update error:', updateError)
    // Non-blocking: login succeeds even if timestamp update fails
  }

  // Determine redirect based on role
  let redirectTo = '/dashboard'
  if (profile.role === 'admin' || profile.role === 'manager') {
    redirectTo = '/admin'
  } else if (profile.role === 'contractor') {
    redirectTo = '/contractor/dashboard'
  }

  return {
    success: true,
    message: 'Connexion réussie',
    redirectTo,
  }
}

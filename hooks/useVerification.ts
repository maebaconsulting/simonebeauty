import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface VerifyCodeParams {
  email: string
  code: string
  type: 'email_verification' | 'password_reset'
}

interface VerifyCodeResponse {
  success: boolean
  message: string
}

interface VerifyCodeError {
  message: string
  type?: string
  attemptsRemaining?: number
}

/**
 * Hook for verifying 6-digit codes
 * Checks:
 * - Code matches database record
 * - Code not expired (15 minutes)
 * - Attempts < 3
 */
export function useVerification() {
  const supabase = createClient()

  return useMutation<VerifyCodeResponse, VerifyCodeError, VerifyCodeParams>({
    mutationFn: async ({ email, code, type }: VerifyCodeParams) => {
      // Get user by email (they may not be logged in yet during signup)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      // If no session, lookup user by email via API route
      if (!user || !session) {
        // Use API route that has admin access to verify code
        const response = await fetch('/api/auth/verify-code-by-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            code,
            type,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw {
            message: errorData.error || 'Code invalide',
            type: errorData.type || 'verification_error',
            attemptsRemaining: errorData.attemptsRemaining,
          }
        }

        // Code verified successfully!
        // The API route has already marked email as verified in the database
        // User will need to log in with their credentials
        return {
          success: true,
          message: 'Email vérifié avec succès !',
        }
      }

      // If user is logged in, use the API route with userId
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          code,
          type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Code invalide',
          type: errorData.type || 'verification_error',
          attemptsRemaining: errorData.attemptsRemaining,
        }
      }

      return {
        success: true,
        message: type === 'email_verification'
          ? 'Email vérifié avec succès !'
          : 'Code vérifié avec succès !',
      }
    },
  })
}

/**
 * Hook to resend verification code
 */
export function useResendCode() {
  return useMutation<VerifyCodeResponse, VerifyCodeError, { email: string; type: 'email_verification' | 'password_reset' }>({
    mutationFn: async ({ email, type }) => {
      // Call API route to send new code
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Échec de l\'envoi du code. Réessayez dans quelques instants.',
          type: 'resend_error',
        }
      }

      return {
        success: true,
        message: 'Un nouveau code a été envoyé à votre email',
      }
    },
  })
}

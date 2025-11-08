import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface ForgotPasswordResponse {
  email: string
  message: string
}

interface ForgotPasswordError {
  message: string
}

interface UseForgotPasswordOptions {
  onSuccess?: (data: ForgotPasswordResponse) => void
  onError?: (error: ForgotPasswordError) => void
}

/**
 * Hook for initiating password reset flow
 * Steps:
 * 1. Verify user exists with this email
 * 2. Send verification code via API route
 * 3. Redirect to reset password page
 */
export function useForgotPassword(options?: UseForgotPasswordOptions) {
  const supabase = createClient()

  return useMutation<ForgotPasswordResponse, ForgotPasswordError, string>({
    mutationFn: async (email: string) => {
      // Step 1: Check if user exists (without revealing if they don't for security)
      // We'll let the API handle this to avoid user enumeration

      // Step 2: Send password reset code via API route
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: 'password_reset',
          // userId will be looked up by email on server side
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Erreur lors de l\'envoi du code',
        }
      }

      return {
        email,
        message: 'Un code de vérification a été envoyé à votre adresse email',
      }
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

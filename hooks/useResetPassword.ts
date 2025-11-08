import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface ResetPasswordData {
  email: string
  code: string
  newPassword: string
}

interface ResetPasswordError {
  message: string
}

interface UseResetPasswordOptions {
  onSuccess?: () => void
  onError?: (error: ResetPasswordError) => void
}

/**
 * Hook for resetting password with verification code
 * Steps:
 * 1. Verify the code is valid and not expired
 * 2. Update password in Supabase Auth
 * 3. Mark code as used
 */
export function useResetPassword(options?: UseResetPasswordOptions) {
  return useMutation<void, ResetPasswordError, ResetPasswordData>({
    mutationFn: async ({ email, code, newPassword }) => {
      // Call API route that handles everything (lookup user + verify code + update password)
      // API route has admin access
      const response = await fetch('/api/auth/reset-password-with-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error || 'Erreur lors de la réinitialisation du mot de passe',
        }
      }
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

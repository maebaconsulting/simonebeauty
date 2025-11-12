import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface PasswordChangeParams {
  currentPassword: string
  newPassword: string
}

interface PasswordChangeResponse {
  success: boolean
  message: string
}

interface PasswordChangeError {
  message: string
  type?: string
}

/**
 * Hook for changing user password
 * Invalidates all sessions except current one (handled by Supabase)
 */
export function usePasswordChange() {
  const supabase = createClient()

  return useMutation<PasswordChangeResponse, PasswordChangeError, PasswordChangeParams>({
    mutationFn: async ({ currentPassword, newPassword }: PasswordChangeParams) => {
      // First, verify current password by attempting to sign in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        throw {
          message: 'Utilisateur non authentifié',
          type: 'not_authenticated',
        }
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw {
          message: 'Mot de passe actuel incorrect',
          type: 'invalid_current_password',
        }
      }

      // Update password
      // Supabase automatically invalidates all other sessions except current one
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw {
          message: updateError.message || 'Erreur lors du changement de mot de passe',
          type: 'update_error',
        }
      }

      return {
        success: true,
        message: 'Mot de passe changé avec succès. Toutes vos autres sessions ont été déconnectées.',
      }
    },
  })
}

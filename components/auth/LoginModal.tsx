'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useLogin } from '@/hooks/useLogin'
import { userKeys } from '@/hooks/useUser'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSwitchToSignup?: () => void
  onSwitchToForgotPassword?: () => void
}

export function LoginModal({
  open,
  onClose,
  onSwitchToSignup,
  onSwitchToForgotPassword,
}: LoginModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const loginMutation = useLogin()

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember_me: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})
  const [serverError, setServerError] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    // Clear server error when user starts typing
    if (serverError) {
      setServerError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError('')

    // Validate form data
    const result = loginSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof LoginFormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    // Attempt login
    loginMutation.mutate(
      { email: formData.email, password: formData.password },
      {
        onSuccess: async (data) => {
          // Invalidate user cache to force fresh fetch
          await queryClient.invalidateQueries({ queryKey: userKeys.current() })
          // Close modal - middleware will handle redirect
          onClose()
        },
        onError: (error: any) => {
          if (error.type === 'account_not_verified') {
            onClose()
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
          } else {
            setServerError(error.message || 'Une erreur est survenue lors de la connexion')
          }
        },
      }
    )
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal content */}
          <div className="p-8">
            {/* Title */}
            <h2 className="font-playfair text-2xl font-semibold text-center text-gray-900 mb-8">
              Connexion
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Adresse e-mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className={`h-12 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={loginMutation.isPending}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`h-12 pr-12 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{serverError}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-[#E97B6E] hover:bg-[#E97B6E]/90 text-white rounded-lg font-medium text-base"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Info box */}
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Vous aviez déjà un compte ? Utilisez 'Mot de passe oublié' pour y accéder facilement.
                </p>
              </div>

              {/* Forgot password link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onSwitchToForgotPassword?.()
                  }}
                  className="text-sm text-[#E97B6E] hover:text-[#E97B6E]/80 font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Sign up link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onSwitchToSignup?.()
                    }}
                    className="text-[#E97B6E] hover:text-[#E97B6E]/80 font-medium"
                  >
                    S'inscrire
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

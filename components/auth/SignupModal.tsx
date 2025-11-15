'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useSignup } from '@/hooks/useSignup'
import { signupSchema, type SignupFormData } from '@/lib/validations/auth-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SignupModalProps {
  open: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
}

export function SignupModal({
  open,
  onClose,
  onSwitchToLogin,
}: SignupModalProps) {
  const router = useRouter()
  const signupMutation = useSignup()

  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({})
  const [serverError, setServerError] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof SignupFormData]) {
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
    const result = signupSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof SignupFormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    // Attempt signup
    signupMutation.mutate(formData, {
      onSuccess: (data) => {
        onClose()
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      },
      onError: (error: any) => {
        setServerError(error.message || 'Une erreur est survenue lors de l\'inscription')
      },
    })
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal content */}
          <div className="p-8">
            {/* Title */}
            <h2 className="font-playfair text-2xl font-semibold text-center text-gray-900 mb-8">
              Créer un compte
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Prénom
                  </label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Jean"
                    className={`h-12 ${errors.first_name ? 'border-red-500' : ''}`}
                    disabled={signupMutation.isPending}
                    autoComplete="given-name"
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Nom
                  </label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className={`h-12 ${errors.last_name ? 'border-red-500' : ''}`}
                    disabled={signupMutation.isPending}
                    autoComplete="family-name"
                  />
                  {errors.last_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

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
                  disabled={signupMutation.isPending}
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
                    disabled={signupMutation.isPending}
                    autoComplete="new-password"
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
                <p className="text-xs text-gray-500 mt-1">
                  8+ caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
                </p>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password field */}
              <div>
                <label
                  htmlFor="confirm_password"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`h-12 pr-12 ${errors.confirm_password ? 'border-red-500' : ''}`}
                    disabled={signupMutation.isPending}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirm_password}</p>
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
                disabled={signupMutation.isPending}
                className="w-full h-12 bg-[#E97B6E] hover:bg-[#E97B6E]/90 text-white rounded-lg font-medium text-base mt-6"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  'S\'inscrire'
                )}
              </Button>

              {/* Login link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onSwitchToLogin?.()
                    }}
                    className="text-[#E97B6E] hover:text-[#E97B6E]/80 font-medium"
                  >
                    Se connecter
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

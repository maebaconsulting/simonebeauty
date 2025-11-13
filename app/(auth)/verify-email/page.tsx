'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import { useVerification, useResendCode } from '@/hooks/useVerification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const verificationMutation = useVerification()
  const resendCodeMutation = useResendCode()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('Le code doit contenir exactement 6 chiffres')
      return
    }

    if (!email) {
      setError('Email manquant. Veuillez recommencer l\'inscription.')
      return
    }

    verificationMutation.mutate(
      { email, code, type: 'email_verification' },
      {
        onSuccess: () => {
          setSuccess(true)
          // Redirect to login after 2 seconds
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        },
        onError: (error: any) => {
          setError(error.message || 'Code invalide. Veuillez réessayer.')
        },
      }
    )
  }

  const handleResendCode = () => {
    if (!email) {
      setError('Email manquant. Veuillez recommencer l\'inscription.')
      return
    }

    setError('')
    setResendSuccess(false)

    resendCodeMutation.mutate(
      { email, type: 'email_verification' },
      {
        onSuccess: () => {
          setResendSuccess(true)
          setResendCooldown(60) // 60 seconds cooldown
          setTimeout(() => setResendSuccess(false), 5000)
        },
        onError: (error: any) => {
          setError(error.message || 'Échec de l\'envoi du code')
        },
      }
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-playfair text-2xl font-semibold text-gray-900 mb-4">
              Email vérifié avec succès !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre compte a été activé. Vous allez être redirigé vers la page de connexion...
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-[#E97B6E] mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E97B6E]/10 rounded-full mb-4">
            <Mail className="h-8 w-8 text-[#E97B6E]" />
          </div>
          <h1 className="font-playfair text-2xl font-semibold text-gray-900 mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-gray-600 text-sm">
            Nous avons envoyé un code de vérification à 6 chiffres à
          </p>
          <p className="text-gray-900 font-medium mt-1">{email || 'votre adresse email'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Code input */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Code de vérification
            </label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              className="h-14 text-center text-2xl font-mono tracking-widest"
              disabled={verificationMutation.isPending}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Entrez le code à 6 chiffres reçu par email
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 text-center">{error}</p>
            </div>
          )}

          {/* Resend success message */}
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 text-center">
                Un nouveau code a été envoyé à votre email
              </p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={verificationMutation.isPending || code.length !== 6}
            className="w-full h-12 bg-[#E97B6E] hover:bg-[#E97B6E]/90 text-white rounded-lg font-medium text-base"
          >
            {verificationMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              'Vérifier'
            )}
          </Button>

          {/* Resend code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Vous n'avez pas reçu le code ?
            </p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCodeMutation.isPending || resendCooldown > 0}
              className="text-sm text-[#E97B6E] hover:text-[#E97B6E]/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCodeMutation.isPending ? (
                <>
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  Envoi...
                </>
              ) : resendCooldown > 0 ? (
                `Renvoyer le code (${resendCooldown}s)`
              ) : (
                'Renvoyer le code'
              )}
            </button>
          </div>

          {/* Back to login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">Chargement...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

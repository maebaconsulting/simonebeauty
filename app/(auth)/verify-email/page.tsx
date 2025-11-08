'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useVerification, useResendCode } from '@/hooks/useVerification'
import { VerificationCodeInput } from '@/components/auth/VerificationCodeInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const { mutate: verifyCode, isPending, error } = useVerification()
  const { mutate: resendCode, isPending: isResending } = useResendCode()

  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(60) // 1 minute cooldown

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleCodeComplete = (code: string) => {
    verifyCode(
      {
        email,
        code,
        type: 'email_verification',
      },
      {
        onSuccess: () => {
          // Redirect to login page with success message
          // User needs to log in with their credentials
          setTimeout(() => {
            router.push('/login?message=email-verified')
          }, 1500)
        },
      }
    )
  }

  const handleResendCode = () => {
    resendCode(
      {
        email,
        type: 'email_verification',
      },
      {
        onSuccess: () => {
          setCanResend(false)
          setCountdown(60) // Reset countdown
        },
      }
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vérifiez votre email</CardTitle>
          <CardDescription>
            Un code à 6 chiffres a été envoyé à{' '}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <VerificationCodeInput onComplete={handleCodeComplete} disabled={isPending} />

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center">
                {error.message}
              </div>
            )}

            {isPending && (
              <div className="text-sm text-center text-muted-foreground">
                Vérification en cours...
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={!canResend || isResending}
                className="text-sm"
              >
                {isResending
                  ? 'Envoi en cours...'
                  : canResend
                    ? 'Renvoyer le code'
                    : `Renvoyer le code (${countdown}s)`}
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Le code expire dans 15 minutes
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Chargement...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

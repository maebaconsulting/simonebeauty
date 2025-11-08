'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useResetPassword } from '@/hooks/useResetPassword'
import { VerificationCodeInput } from './VerificationCodeInput'

const resetPasswordSchema = z
  .object({
    code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type ResetPasswordData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: '',
      password: '',
      confirmPassword: '',
    },
  })

  const { mutate: resetPassword, isPending } = useResetPassword({
    onSuccess: () => {
      router.push('/login?message=password-reset-success')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const handleCodeComplete = (code: string) => {
    setValue('code', code, { shouldValidate: true })
  }

  const onSubmit = (data: ResetPasswordData) => {
    if (!email) {
      setError('Email manquant. Veuillez recommencer le processus.')
      return
    }

    setError(null)
    resetPassword({
      email,
      code: data.code,
      newPassword: data.password,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email display */}
      <div className="rounded-md bg-muted p-3 text-sm">
        <p className="text-muted-foreground">
          Code envoyé à: <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {/* Verification Code */}
      <div className="space-y-2">
        <Label htmlFor="code">Code de vérification</Label>
        <VerificationCodeInput
          length={6}
          onComplete={handleCodeComplete}
          disabled={isPending}
        />
        {errors.code && (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        )}
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="Minimum 8 caractères"
          disabled={isPending}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirmez votre mot de passe"
          disabled={isPending}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
      </Button>

      {/* Resend code */}
      <div className="text-center text-sm">
        <button
          type="button"
          className="text-muted-foreground hover:text-primary"
          onClick={() => {
            // TODO: Implement resend functionality
            alert('Fonctionnalité de renvoi à implémenter')
          }}
        >
          Vous n'avez pas reçu le code ? Renvoyer
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordResetSchema, type PasswordResetData } from '@/lib/validations/auth-schemas'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useResetPassword } from '@/hooks/useResetPassword'
import { VerificationCodeInput } from './VerificationCodeInput'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [error, setError] = useState<string | null>(null)

  const form = useForm<PasswordResetData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      code: '',
      new_password: '',
      confirm_password: '',
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

  const onSubmit = (data: PasswordResetData) => {
    if (!email) {
      setError('Email manquant. Veuillez recommencer le processus.')
      return
    }

    setError(null)
    resetPassword({
      email,
      code: data.code,
      newPassword: data.new_password,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code de vérification</FormLabel>
              <FormControl>
                <VerificationCodeInput
                  length={6}
                  onComplete={(code) => {
                    form.setValue('code', code, { shouldValidate: true })
                  }}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Password */}
        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nouveau mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Minimum 8 caractères"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
    </Form>
  )
}

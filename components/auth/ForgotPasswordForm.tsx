'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { passwordResetRequestSchema, type PasswordResetRequestData } from '@/lib/validations/auth-schemas'
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
import { useForgotPassword } from '@/hooks/useForgotPassword'

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void
  compact?: boolean
}

export function ForgotPasswordForm({ onSuccess, compact }: ForgotPasswordFormProps = {}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PasswordResetRequestData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  })

  const { mutate: forgotPassword, isPending } = useForgotPassword({
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data.email)
      } else {
        // Default behavior: redirect to reset password page
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`)
      }
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = (data: PasswordResetRequestData) => {
    setError(null)
    forgotPassword(data.email)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={compact ? "space-y-4" : "space-y-6"}>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={compact ? "text-base font-semibold" : ""}>
                Adresse e-mail
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  autoComplete="email"
                  disabled={isPending}
                  {...field}
                  className={compact ? "h-12 text-base" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className={`w-full ${compact ? "h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full" : ""}`}
          disabled={isPending}
        >
          {isPending ? 'Envoi en cours...' : 'Envoyer le code'}
        </Button>
      </form>
    </Form>
  )
}

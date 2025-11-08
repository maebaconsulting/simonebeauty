'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useForgotPassword } from '@/hooks/useForgotPassword'

const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void
  compact?: boolean
}

export function ForgotPasswordForm({ onSuccess, compact }: ForgotPasswordFormProps = {}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
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

  const onSubmit = (data: ForgotPasswordData) => {
    setError(null)
    forgotPassword(data.email)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={compact ? "space-y-4" : "space-y-6"}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className={compact ? "text-base font-semibold" : ""}>
          Adresse e-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          autoComplete="email"
          disabled={isPending}
          {...register('email')}
          className={compact ? "h-12 text-base" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className={`w-full ${compact ? "h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full" : ""}`}
        disabled={isPending}
      >
        {isPending ? 'Envoi en cours...' : 'Envoyer le code'}
      </Button>
    </form>
  )
}

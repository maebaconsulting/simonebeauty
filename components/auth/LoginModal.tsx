'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth-schemas'
import { useLogin } from '@/hooks/useLogin'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { X } from 'lucide-react'

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
  const { mutate: login, isPending, error } = useLogin()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: true,
    },
  })

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: (response) => {
        onClose()
        router.push(response.redirectTo)
      },
      onError: (error) => {
        if (error.type === 'account_not_verified') {
          const email = form.getValues('email')
          onClose()
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 relative">
          <DialogTitle className="font-playfair text-4xl text-center font-normal">
            Connexion
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Form */}
        <div className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Adresse e-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        {...field}
                        disabled={isPending}
                        autoComplete="email"
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isPending}
                        autoComplete="current-password"
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive">
                  {error.message}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full"
                disabled={isPending}
              >
                {isPending ? 'Connexion en cours...' : 'Se connecter'}
              </Button>

              {/* Helper Text */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 text-center">
                Vous aviez déjà un compte ? Utilisez 'Mot de passe oublié' pour y accéder facilement.
              </div>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onSwitchToForgotPassword?.()
                  }}
                  className="text-button-primary hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Signup Link */}
              <div className="text-center text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onSwitchToSignup?.()
                  }}
                  className="text-button-primary hover:underline font-medium"
                >
                  S'inscrire
                </button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

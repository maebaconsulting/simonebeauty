'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData } from '@/lib/validations/auth-schemas'
import { useSignup } from '@/hooks/useSignup'
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
import { X } from 'lucide-react'

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
  const { mutate: signup, isPending, error } = useSignup()
  const [email, setEmail] = useState('')

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
    },
  })

  const onSubmit = (data: SignupFormData) => {
    setEmail(data.email)
    signup(data, {
      onSuccess: () => {
        onClose()
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 relative sticky top-0 bg-white z-10">
          <DialogTitle className="font-playfair text-4xl text-center font-normal">
            Créer un compte
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Prénom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jean"
                          {...field}
                          disabled={isPending}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Nom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Dupont"
                          {...field}
                          disabled={isPending}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        className="h-12"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      8+ caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
                    </p>
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
                    <FormLabel className="text-base font-semibold">Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isPending}
                        className="h-12"
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
                {isPending ? 'Inscription en cours...' : 'S\'inscrire'}
              </Button>

              {/* Login Link */}
              <div className="text-center text-gray-600">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onSwitchToLogin?.()
                  }}
                  className="text-button-primary hover:underline font-medium"
                >
                  Se connecter
                </button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth-schemas'
import { useLogin } from '@/hooks/useLogin'
import { userKeys } from '@/hooks/useUser'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
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
      onSuccess: async (response) => {
        console.log('[LoginForm] onSuccess called with redirectTo:', response.redirectTo)
        // Invalidate user cache to force fresh fetch
        await queryClient.invalidateQueries({ queryKey: userKeys.current() })
        console.log('[LoginForm] About to redirect to:', response.redirectTo)
        // Use window.location for a hard redirect
        // This ensures the session cookies are properly set before navigation
        // and triggers the middleware with fresh auth state
        window.location.href = response.redirectTo
        console.log('[LoginForm] window.location.href set to:', response.redirectTo)
      },
      onError: (error) => {
        // Check if account not verified - redirect to verification page
        if (error.type === 'account_not_verified') {
          const email = form.getValues('email')
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        }
      },
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte Simone Paris
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jean.dupont@example.com"
                      {...field}
                      disabled={isPending}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={isPending}
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="remember_me"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Se souvenir de moi
                    </FormLabel>
                  </FormItem>
                )}
              />

              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié ?
              </a>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Connexion en cours...' : 'Se connecter'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Pas encore de compte ? </span>
              <a href="/signup" className="text-primary hover:underline">
                S'inscrire
              </a>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

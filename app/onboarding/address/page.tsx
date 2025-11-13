'use client'

/**
 * Onboarding Address Page
 * Step 2 of signup flow - collect user's first address
 * Required before email verification
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Loader2, ArrowRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const addressSchema = z.object({
  type: z.enum(['home', 'work', 'other']).default('home'),
  street: z.string().min(1, 'Adresse requise'),
  city: z.string().min(1, 'Ville requise'),
  postal_code: z.string().min(1, 'Code postal requis'),
  country: z.string().min(1, 'Pays requis').default('France'),
  building_info: z.string().optional(),
  delivery_instructions: z.string().optional(),
})

type AddressFormData = z.infer<typeof addressSchema>

export default function OnboardingAddressPage() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailForVerification, setEmailForVerification] = useState<string>('')

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'home',
      street: '',
      city: '',
      postal_code: '',
      country: 'France',
      building_info: '',
      delivery_instructions: '',
    },
  })

  // Get email from sessionStorage (set during signup)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = sessionStorage.getItem('signup_email')
      if (email) {
        setEmailForVerification(email)
      }
    }
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/client/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          is_default: true, // First address is always default
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'ajout de l\'adresse')
      }

      // Clear signup email from session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('signup_email')
      }

      // Redirect to email verification
      if (emailForVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(emailForVerification)}`)
      } else {
        router.push('/verify-email')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-button-primary animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Inscription</span>
            </div>
            <div className="w-16 h-1 bg-button-primary"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-button-primary text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Adresse</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">Vérification</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-button-primary/10 rounded-full">
                <MapPin className="w-6 h-6 text-button-primary" />
              </div>
              <div>
                <CardTitle>Ajoutez votre adresse</CardTitle>
                <CardDescription>
                  Nous avons besoin de votre adresse pour vous proposer nos services
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'adresse</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          disabled={isSubmitting}
                        >
                          <option value="home">Domicile</option>
                          <option value="work">Travail</option>
                          <option value="other">Autre</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Street */}
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Rue de la Paix"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City and Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Paris"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="75001"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Country */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          disabled={isSubmitting}
                        >
                          <option value="France">France</option>
                          <option value="Belgique">Belgique</option>
                          <option value="Pays-Bas">Pays-Bas</option>
                          <option value="Allemagne">Allemagne</option>
                          <option value="Espagne">Espagne</option>
                          <option value="Italie">Italie</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Building Info (Optional) */}
                <FormField
                  control={form.control}
                  name="building_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complément d'adresse</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bâtiment B, 3ème étage, Porte 12"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Numéro d'appartement, étage, code d'accès, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery Instructions (Optional) */}
                <FormField
                  control={form.control}
                  name="delivery_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions d'accès</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sonner à l'interphone, code 1234A"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Informations utiles pour nos prestataires
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        Continuer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-4">
                  Vous pourrez ajouter d'autres adresses plus tard depuis votre profil
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

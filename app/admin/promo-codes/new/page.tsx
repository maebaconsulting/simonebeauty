'use client'

/**
 * New Promo Code Page
 * Feature: 015-promo-codes-system
 *
 * Admin page for creating new promo codes
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCreatePromoCode } from '@/hooks/usePromoCodes'
import { PromoCodeForm } from '@/components/promo-codes/PromoCodeForm'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { PromoCodeFormData } from '@/types/promo-form'

export default function NewPromoCodePage() {
  const router = useRouter()
  const supabase = createClient()
  const createPromoCode = useCreatePromoCode()

  // Check authentication and role
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      return data
    },
    enabled: !!session?.user?.id,
  })

  useEffect(() => {
    if (session === undefined || profile === undefined) return

    if (!session) {
      router.push('/login')
      return
    }

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      router.push('/')
      return
    }
  }, [session, profile, router])

  const handleSubmit = async (data: PromoCodeFormData) => {
    try {
      // Convert dates to ISO strings and prepare data
      const submitData = {
        ...data,
        code: data.code.toUpperCase(),
        valid_from: data.valid_from.toISOString(),
        valid_until: data.valid_until ? data.valid_until.toISOString() : null,
        // Convert discount value to cents for fixed_amount
        discount_value: data.discount_type === 'fixed_amount'
          ? Math.round(data.discount_value * 100)
          : data.discount_value,
        // Convert max_discount_amount to cents if present
        max_discount_amount: data.max_discount_amount
          ? Math.round(data.max_discount_amount * 100)
          : null,
        // Convert min_order_amount to cents if present
        min_order_amount: data.min_order_amount
          ? Math.round(data.min_order_amount * 100)
          : null,
      }

      await createPromoCode.mutateAsync(submitData)

      toast.success('Code promo créé', {
        description: `Le code "${data.code}" a été créé avec succès.`,
      })

      // Redirect to list page
      router.push('/admin/promo-codes')
    } catch (error: any) {
      console.error('Error creating promo code:', error)
      toast.error('Erreur lors de la création', {
        description: error.message || 'Une erreur est survenue.',
      })
    }
  }

  if (!session || !profile || !['admin', 'manager'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/promo-codes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Créer un code promotionnel
            </h1>
            <p className="text-gray-600 mt-1">
              Remplissez le formulaire ci-dessous pour créer un nouveau code promo
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoCodeForm
          onSubmit={handleSubmit}
          isSubmitting={createPromoCode.isPending}
        />
      </div>
    </div>
  )
}

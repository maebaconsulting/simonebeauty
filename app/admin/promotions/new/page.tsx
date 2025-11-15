'use client'

/**
 * Admin Promo Code Creation Page
 * Feature: 015-promo-codes-system
 * User Story 2: Admin CRUD Management
 */

import { useRouter } from 'next/navigation'
import { PromoCodeForm } from '@/components/promo-codes/PromoCodeForm'
import { useCreatePromoCode } from '@/hooks/usePromoCodes'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'
import type { PromoCodeFormData } from '@/types/promo-form'
import { transformFormDataToSubmit } from '@/types/promo-form'
import { toast } from 'sonner'

export default function NewPromoCodePage() {
  const router = useRouter()
  const createPromoCode = useCreatePromoCode()

  const handleSubmit = async (data: PromoCodeFormData) => {
    try {
      const submitData = transformFormDataToSubmit(data)
      await createPromoCode.mutateAsync(submitData)

      toast.success('Code promo créé avec succès!', {
        description: `Le code "${data.code}" a été créé et est maintenant disponible.`,
      })

      // Redirect to list page
      router.push('/admin/promotions')
    } catch (error) {
      // Error toast already shown by the hook
      console.error('Failed to create promo code:', error)
      throw error // Re-throw to keep form in submitting state if needed
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/promotions">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Nouveau Code Promotionnel
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Créer un nouveau code promo pour les clients
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoCodeForm
          onSubmit={handleSubmit}
          isSubmitting={createPromoCode.isPending}
        />
      </div>
    </div>
  )
}

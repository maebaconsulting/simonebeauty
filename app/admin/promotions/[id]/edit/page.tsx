'use client'

/**
 * Admin Promo Code Edit Page
 * Feature: 015-promo-codes-system
 * User Story 2: Admin CRUD Management
 */

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { PromoCodeForm } from '@/components/promo-codes/PromoCodeForm'
import { usePromoCode, useUpdatePromoCode } from '@/hooks/usePromoCodes'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Tag, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { PromoCodeFormData } from '@/types/promo-form'
import { transformFormDataToSubmit } from '@/types/promo-form'
import { toast } from 'sonner'

interface EditPromoCodePageProps {
  params: Promise<{ id: string }>
}

export default function EditPromoCodePage({ params }: EditPromoCodePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const updatePromoCode = useUpdatePromoCode()

  // Parse id to number
  const promoCodeId = parseInt(id, 10)

  // Fetch the promo code
  const { data: promoCode, isLoading, error } = usePromoCode(promoCodeId)

  const handleSubmit = async (formData: PromoCodeFormData) => {
    try {
      const submitData = transformFormDataToSubmit(formData)
      await updatePromoCode.mutateAsync({
        id: promoCodeId,
        data: submitData,
      })

      toast.success('Code promo mis à jour avec succès!', {
        description: `Le code "${formData.code}" a été mis à jour.`,
      })

      // Redirect to list page
      router.push('/admin/promotions')
    } catch (error) {
      // Error toast already shown by the hook
      console.error('Failed to update promo code:', error)
      throw error
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Modifier le Code Promotionnel
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-gray-600">Chargement du code promo...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !promoCode) {
    return (
      <div className="min-h-screen bg-gray-50">
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
                  Code Promo Introuvable
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium mb-2">
              Impossible de charger ce code promo
            </p>
            <p className="text-red-600 text-sm mb-4">
              Le code promo demandé n'existe pas ou a été supprimé.
            </p>
            <Link href="/admin/promotions">
              <Button className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white">
                Retour à la liste
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Render form with data
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
                Modifier le Code Promotionnel
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Code: <span className="font-mono font-semibold">{promoCode.code}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoCodeForm
          initialData={promoCode}
          onSubmit={handleSubmit}
          isSubmitting={updatePromoCode.isPending}
        />
      </div>
    </div>
  )
}

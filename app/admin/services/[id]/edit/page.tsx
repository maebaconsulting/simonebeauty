'use client'

/**
 * Edit Service Page
 * Feature: 018-service-management-crud
 *
 * Multi-tab form for editing an existing service with full validation
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useService, useUpdateService, useDeleteService } from '@/hooks/useServiceCRUD'
import { serviceInsertSchema, type ServiceInsertData } from '@/lib/validations/service-schemas'
import ServiceFormLayout from '@/components/admin/services/ServiceForm/ServiceFormLayout'
import GeneralTab from '@/components/admin/services/ServiceForm/GeneralTab'
import PricingTab from '@/components/admin/services/ServiceForm/PricingTab'
import CategoriesTab from '@/components/admin/services/ServiceForm/CategoriesTab'
import ConfigurationTab from '@/components/admin/services/ServiceForm/ConfigurationTab'
import ProtocolTab from '@/components/admin/services/ServiceForm/ProtocolTab'
import {
  ImagesTabPlaceholder,
} from '@/components/admin/services/ServiceForm/PlaceholderTabs'
import { ServiceSupplementsManager } from '@/components/admin/services/ServiceSupplementsManager'
import { ServiceContractorsManager } from '@/components/admin/services/ServiceContractorsManager'
import { MarketsTab } from '@/components/admin/services/ServiceForm/MarketsTab'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// ============================================================================
// Component
// ============================================================================

interface EditServicePageProps {
  params: { id: string }
}

export default function EditServicePage({ params }: EditServicePageProps) {
  const serviceId = parseInt(params.id)
  const router = useRouter()

  const { data: service, isLoading, error } = useService(serviceId)
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const form = useForm<ServiceInsertData>({
    // TEMP: Disable validation to debug
    // resolver: zodResolver(serviceInsertSchema),
    mode: 'onChange',
  })

  // Load service data into form when available
  useEffect(() => {
    if (service) {
      // Map service data to form values
      const formData: ServiceInsertData = {
        name: service.name,
        slug: service.slug,
        description: service.description,
        category_id: service.category_id,
        subcategory_id: service.subcategory_id || undefined,
        base_price: service.base_price,
        base_duration_minutes: service.base_duration_minutes,
        image_url: service.image_url || undefined,
        is_active: service.is_active,
        display_order: service.display_order,
        service_type: service.service_type,
        intro: service.intro || undefined,
        short_description: service.short_description || undefined,
        long_description: service.long_description || undefined,
        hygienic_precautions: service.hygienic_precautions || undefined,
        contraindications: service.contraindications || undefined,
        advises: service.advises || undefined,
        your_session: service.your_session || undefined,
        preparation: service.preparation || undefined,
        suggestion: service.suggestion || undefined,
        for_men: service.for_men,
        for_women: service.for_women,
        for_kids: service.for_kids,
        is_for_entreprise_ready: service.is_for_entreprise_ready,
        has_many_session: service.has_many_session,
        number_of_session: service.number_of_session,
        is_additional_service: service.is_additional_service,
        secondary_image_urls: service.secondary_image_urls || [],
        video_url: service.video_url || undefined,
        tags: service.tags || [],
        cost_price: service.cost_price || undefined,
        is_featured: service.is_featured,
      }

      form.reset(formData)
    }
  }, [service, form])

  const handleSubmit = async (data: ServiceInsertData) => {
    try {
      console.log('📝 Données envoyées:', data)

      const result = await updateService.mutateAsync({
        serviceId,
        updates: data,
      })

      console.log('✅ Résultat de la mise à jour:', result)

      toast.success('Service mis à jour avec succès!', {
        description: `Le service "${data.name}" a été modifié.`,
      })

      // Redirect to services list
      router.push('/admin/services')
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour:', error)
      toast.error('Erreur lors de la mise à jour', {
        description: error.message || 'Une erreur est survenue lors de la modification du service.',
      })
    }
  }

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
        router.push(`/admin/services/${serviceId}`)
      }
    } else {
      router.push(`/admin/services/${serviceId}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm(
      'Voulez-vous vraiment désactiver ce service ? Il ne sera plus visible pour les clients mais restera accessible dans la liste des services inactifs.'
    )) {
      return
    }

    try {
      await deleteService.mutateAsync(serviceId)

      toast.success('Service désactivé', {
        description: 'Le service a été désactivé avec succès.',
      })

      // Redirect to services list
      router.push('/admin/services')
    } catch (error: any) {
      console.error('Error deleting service:', error)
      toast.error('Erreur lors de la désactivation', {
        description: error.message || 'Une erreur est survenue lors de la désactivation du service.',
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du service...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service introuvable</h2>
          <p className="text-gray-600 mb-6">
            Le service demandé n'existe pas ou a été supprimé.
          </p>
          <button
            onClick={() => router.push('/admin/services')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <ServiceFormLayout
      mode="edit"
      form={form}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDelete={handleDelete}
      isSubmitting={updateService.isPending}
      isDeleting={deleteService.isPending}
    >
      {{
        general: <GeneralTab form={form} mode="edit" />,
        pricing: <PricingTab form={form} />,
        images: <ImagesTabPlaceholder serviceId={serviceId} />,
        categories: <CategoriesTab form={form} />,
        supplements: <ServiceSupplementsManager serviceId={serviceId} serviceName={service.name} />,
        contractors: <ServiceContractorsManager serviceId={serviceId} serviceName={service.name} />,
        markets: <MarketsTab serviceId={serviceId} basePrice={form.watch('base_price') || service.base_price} />,
        configuration: <ConfigurationTab form={form} />,
        protocol: <ProtocolTab form={form} />,
      }}
    </ServiceFormLayout>
  )
}

'use client'

/**
 * Edit Service Page
 * Feature: 018-service-management-crud
 *
 * Multi-tab form for editing an existing service
 * Route: /admin/services/[id]/edit
 */

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useService, useUpdateService, useDeleteService } from '@/hooks/useServiceCRUD'
import { serviceUpdateSchema, type ServiceUpdateData } from '@/lib/validations/service-schemas'
import ServiceFormLayout from '@/components/admin/services/ServiceForm/ServiceFormLayout'
import GeneralTab from '@/components/admin/services/ServiceForm/GeneralTab'
import PricingTab from '@/components/admin/services/ServiceForm/PricingTab'
import CategoriesTab from '@/components/admin/services/ServiceForm/CategoriesTab'
import ConfigurationTab from '@/components/admin/services/ServiceForm/ConfigurationTab'
import ProtocolTab from '@/components/admin/services/ServiceForm/ProtocolTab'
import { ImageGalleryManager } from '@/components/admin/ImageGalleryManager'
import { ServiceSupplementsManager } from '@/components/admin/services/ServiceSupplementsManager'
import { ServiceContractorsManager } from '@/components/admin/services/ServiceContractorsManager'
import { MarketsTab } from '@/components/admin/services/ServiceForm/MarketsTab'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// ============================================================================
// Component
// ============================================================================

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = parseInt(params.id as string, 10)

  const { data: service, isLoading, error } = useService(serviceId)
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const form = useForm<ServiceUpdateData>({
    resolver: zodResolver(serviceUpdateSchema),
    mode: 'onChange',
  })

  // Pre-populate form when service data loads
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        slug: service.slug,
        description: service.description,
        category_id: service.category_id,
        subcategory_id: service.subcategory_id,
        base_price: service.base_price,
        base_duration_minutes: service.base_duration_minutes,
        image_url: service.image_url,
        is_active: service.is_active,
        display_order: service.display_order,
        service_type: service.service_type,
        intro: service.intro,
        short_description: service.short_description,
        long_description: service.long_description,
        hygienic_precautions: service.hygienic_precautions,
        contraindications: service.contraindications,
        advises: service.advises,
        your_session: service.your_session,
        preparation: service.preparation,
        suggestion: service.suggestion,
        for_men: service.for_men,
        for_women: service.for_women,
        for_kids: service.for_kids,
        is_for_entreprise_ready: service.is_for_entreprise_ready,
        has_many_session: service.has_many_session,
        number_of_session: service.number_of_session,
        is_additional_service: service.is_additional_service,
        secondary_image_urls: service.secondary_image_urls,
        video_url: service.video_url,
        tags: service.tags,
        cost_price: service.cost_price,
        is_featured: service.is_featured,
      })
    }
  }, [service, form])

  const handleSubmit = async (data: ServiceUpdateData) => {
    try {
      await updateService.mutateAsync({
        serviceId,
        updates: data,
      })

      toast.success('Service mis à jour!', {
        description: `Le service "${data.name || service?.name}" a été mis à jour avec succès.`,
      })
    } catch (error: any) {
      console.error('Error updating service:', error)
      toast.error('Erreur lors de la mise à jour', {
        description: error.message || 'Une erreur est survenue lors de la mise à jour du service.',
      })
    }
  }

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
        router.push('/admin/services')
      }
    } else {
      router.push('/admin/services')
    }
  }

  const handleDelete = async () => {
    if (!service) return

    const confirmMessage = `Êtes-vous sûr de vouloir désactiver le service "${service.name}" ?\n\nLe service sera marqué comme inactif et ne sera plus visible pour les clients.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await deleteService.mutateAsync(serviceId)

      toast.success('Service désactivé', {
        description: `Le service "${service.name}" a été désactivé avec succès.`,
      })

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Service introuvable</h1>
            <p className="text-gray-600 mb-6">
              Le service demandé n'existe pas ou a été supprimé.
            </p>
            <Link href="/admin/services">
              <Button className="w-full">
                Retour à la liste des services
              </Button>
            </Link>
          </div>
        </Card>
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
        images: (
          <ImageGalleryManager
            entityType="service"
            entityId={serviceId}
            maxImages={10}
          />
        ),
        categories: <CategoriesTab form={form} />,
        supplements: (
          <ServiceSupplementsManager
            serviceId={serviceId}
            serviceName={service.name}
          />
        ),
        contractors: (
          <ServiceContractorsManager
            serviceId={serviceId}
            serviceName={service.name}
          />
        ),
        markets: <MarketsTab serviceId={serviceId} basePrice={form.watch('base_price') || service.base_price} />,
        configuration: <ConfigurationTab form={form} />,
        protocol: <ProtocolTab form={form} />,
      }}
    </ServiceFormLayout>
  )
}

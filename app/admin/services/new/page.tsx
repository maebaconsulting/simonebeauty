'use client'

/**
 * Create Service Page
 * Feature: 018-service-management-crud
 *
 * Multi-tab form for creating a new service with full validation
 */

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateService } from '@/hooks/useServiceCRUD'
import { serviceInsertSchema, type ServiceInsertData } from '@/lib/validations/service-schemas'
import ServiceFormLayout from '@/components/admin/services/ServiceForm/ServiceFormLayout'
import GeneralTab from '@/components/admin/services/ServiceForm/GeneralTab'
import PricingTab from '@/components/admin/services/ServiceForm/PricingTab'
import CategoriesTab from '@/components/admin/services/ServiceForm/CategoriesTab'
import ConfigurationTab from '@/components/admin/services/ServiceForm/ConfigurationTab'
import ProtocolTab from '@/components/admin/services/ServiceForm/ProtocolTab'
import {
  ImagesTabPlaceholder,
  SupplementsTabPlaceholder,
  ContractorsTabPlaceholder,
} from '@/components/admin/services/ServiceForm/PlaceholderTabs'
import { toast } from 'sonner'

// ============================================================================
// Default Values
// ============================================================================

const defaultValues: Partial<ServiceInsertData> = {
  // Core fields
  name: '',
  slug: '',
  description: '',
  category_id: undefined,
  subcategory_id: undefined,
  base_price: 0,
  base_duration_minutes: 60,
  image_url: undefined,
  is_active: true,
  display_order: 0,
  service_type: 'at_home',

  // Extended fields
  intro: undefined,
  short_description: undefined,
  long_description: undefined,
  hygienic_precautions: undefined,
  contraindications: undefined,
  advises: undefined,
  your_session: undefined,
  preparation: undefined,
  suggestion: undefined,
  for_men: false,
  for_women: false,
  for_kids: false,
  is_for_entreprise_ready: false,
  has_many_session: false,
  number_of_session: 1,
  is_additional_service: false,
  secondary_image_urls: [],
  video_url: undefined,
  tags: [],
  cost_price: undefined,
  is_featured: false,
}

// ============================================================================
// Component
// ============================================================================

export default function CreateServicePage() {
  const router = useRouter()
  const createService = useCreateService()

  const form = useForm<ServiceInsertData>({
    resolver: zodResolver(serviceInsertSchema),
    defaultValues,
    mode: 'onChange', // Validate on change for better UX
  })

  const handleSubmit = async (data: ServiceInsertData) => {
    try {
      const result = await createService.mutateAsync(data)

      toast.success('Service créé avec succès!', {
        description: `Le service "${result.name}" a été créé.`,
      })

      // Redirect to edit page to continue configuring the service
      router.push(`/admin/services/${result.id}/edit`)
    } catch (error: any) {
      console.error('Error creating service:', error)
      toast.error('Erreur lors de la création', {
        description: error.message || 'Une erreur est survenue lors de la création du service.',
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

  return (
    <ServiceFormLayout
      mode="create"
      form={form}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={createService.isPending}
    >
      {{
        general: <GeneralTab form={form} mode="create" />,
        pricing: <PricingTab form={form} />,
        images: <ImagesTabPlaceholder />,
        categories: <CategoriesTab form={form} />,
        supplements: <SupplementsTabPlaceholder />,
        contractors: <ContractorsTabPlaceholder />,
        configuration: <ConfigurationTab form={form} />,
        protocol: <ProtocolTab form={form} />,
      }}
    </ServiceFormLayout>
  )
}

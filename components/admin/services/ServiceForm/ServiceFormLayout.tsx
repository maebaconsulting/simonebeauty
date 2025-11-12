'use client'

/**
 * Service Form Layout - Multi-Tab Interface
 * Feature: 018-service-management-crud
 *
 * Main layout component for service create/edit forms
 * Implements 8-tab interface matching legacy application design
 */

import { useState, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  FileText,
  DollarSign,
  Image,
  Folder,
  Package,
  Users,
  Settings,
  ClipboardList,
  Save,
  X,
  Loader2,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ServiceFormLayoutProps {
  mode: 'create' | 'edit'
  form: UseFormReturn<any>
  onSubmit: (data: any) => void | Promise<void>
  onCancel: () => void
  onDelete?: () => void | Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
  children: {
    general: ReactNode
    pricing: ReactNode
    images: ReactNode
    categories: ReactNode
    supplements: ReactNode
    contractors: ReactNode
    configuration: ReactNode
    protocol: ReactNode
  }
}

interface TabConfig {
  id: string
  label: string
  icon: typeof FileText
  disabled?: boolean
}

// ============================================================================
// Tab Configuration
// ============================================================================

const tabs: TabConfig[] = [
  {
    id: 'general',
    label: 'Général',
    icon: FileText,
  },
  {
    id: 'pricing',
    label: 'Prix & Durée',
    icon: DollarSign,
  },
  {
    id: 'images',
    label: 'Images',
    icon: Image,
  },
  {
    id: 'categories',
    label: 'Catégories',
    icon: Folder,
  },
  {
    id: 'supplements',
    label: 'Suppléments',
    icon: Package,
  },
  {
    id: 'contractors',
    label: 'Prestataires',
    icon: Users,
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Settings,
  },
  {
    id: 'protocol',
    label: 'Protocole',
    icon: ClipboardList,
  },
]

// ============================================================================
// Component
// ============================================================================

export default function ServiceFormLayout({
  mode,
  form,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
  children,
}: ServiceFormLayoutProps) {
  const [activeTab, setActiveTab] = useState('general')

  // Get form errors for tab indicators
  const errors = form.formState.errors
  const hasErrorInTab = (tabId: string): boolean => {
    const tabFieldMap: Record<string, string[]> = {
      general: ['name', 'slug', 'description', 'intro', 'short_description', 'long_description'],
      pricing: ['base_price', 'cost_price', 'base_duration_minutes', 'has_many_session', 'number_of_session'],
      categories: ['category_id', 'subcategory_id', 'tags'],
      configuration: ['service_type', 'for_men', 'for_women', 'for_kids', 'is_for_entreprise_ready'],
      protocol: ['preparation', 'your_session', 'advises', 'suggestion', 'hygienic_precautions', 'contraindications'],
    }

    const fields = tabFieldMap[tabId] || []
    return fields.some(field => errors[field])
  }

  const handleSubmit = form.handleSubmit(onSubmit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Créer un service' : 'Modifier le service'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'create'
                  ? 'Remplissez les informations du nouveau service'
                  : 'Modifiez les informations du service'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {mode === 'edit' && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isSubmitting || isDeleting}
                  className="mr-auto"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Désactiver
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isDeleting}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white"
                form="service-form"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="service-form" onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tabs Navigation */}
            <Card className="p-2">
              <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const hasError = hasErrorInTab(tab.id)

                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      disabled={tab.disabled}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 relative',
                        'data-[state=active]:bg-purple-50 data-[state=active]:text-purple-900',
                        'data-[state=active]:border-b-2 data-[state=active]:border-purple-600',
                        hasError && 'text-red-600',
                        tab.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                      {hasError && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      {tab.disabled && (
                        <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded">
                          Bientôt
                        </span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Card>

            {/* Tab Contents */}
            <Card className="p-8">
              <TabsContent value="general" className="mt-0">
                {children.general}
              </TabsContent>

              <TabsContent value="pricing" className="mt-0">
                {children.pricing}
              </TabsContent>

              <TabsContent value="images" className="mt-0">
                {children.images}
              </TabsContent>

              <TabsContent value="categories" className="mt-0">
                {children.categories}
              </TabsContent>

              <TabsContent value="supplements" className="mt-0">
                {children.supplements}
              </TabsContent>

              <TabsContent value="contractors" className="mt-0">
                {children.contractors}
              </TabsContent>

              <TabsContent value="configuration" className="mt-0">
                {children.configuration}
              </TabsContent>

              <TabsContent value="protocol" className="mt-0">
                {children.protocol}
              </TabsContent>
            </Card>

            {/* Bottom Action Bar (sticky on scroll) */}
            <div className="sticky bottom-0 bg-white border-t p-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {form.formState.isDirty ? (
                    <span className="text-orange-600 font-medium">
                      Modifications non enregistrées
                    </span>
                  ) : (
                    <span>Aucune modification</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer le service
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  )
}

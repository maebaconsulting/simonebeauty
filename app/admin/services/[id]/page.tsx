'use client'

/**
 * Service Detail Page
 * Feature: 017-image-management + 018-service-management
 *
 * Page de détail d'un service avec gestion des:
 * - Images (upload, réorganisation, alt-text, AI)
 * - Suppléments (durée, produits, addons, options)
 * - Prestataires (association, prix personnalisés)
 *
 * Route: /admin/services/[id]
 */

import { useParams, useRouter } from 'next/navigation'
import { useService } from '@/hooks/useServiceCRUD'
import { ServiceDetailTabs } from '@/components/admin/services/ServiceDetailTabs'
import { Loader2, AlertCircle, Edit, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ServiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = parseInt(params.id as string, 10)

  const { data: service, isLoading, error } = useService(serviceId)

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
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste des services
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link href="/admin/services">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {service.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les images, suppléments et prestataires de ce service
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-600">Prix de base</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(service.base_price / 100).toFixed(0)} €
                </div>
              </div>
              <Link href={`/admin/services/${serviceId}/edit`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Modifier le service
                </Button>
              </Link>
            </div>
          </div>

          {/* Service Status Badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              service.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {service.is_active ? '✓ Actif' : '○ Inactif'}
            </span>
            {service.is_featured && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                ★ Mis en avant
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {service.base_duration_minutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Service Detail Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ServiceDetailTabs
          serviceId={serviceId}
          serviceName={service.name}
        />
      </div>
    </div>
  )
}

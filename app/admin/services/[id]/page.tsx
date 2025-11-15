/**
 * Admin Service Edit Page
 * Feature: 017-image-management
 * SpecKit: US0 - Admin Image Management for Services
 *
 * Service detail and edit page with image management
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DuplicateServiceButton } from '@/components/admin/services/DuplicateServiceButton'
import { ServiceDetailTabs } from '@/components/admin/services/ServiceDetailTabs'

interface ServiceEditPageProps {
  params: {
    id: string
  }
}

export default async function ServiceEditPage({ params }: ServiceEditPageProps) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check admin/manager role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    redirect('/') // Redirect non-admin users
  }

  // Fetch service details
  const serviceId = parseInt(params.id, 10)
  if (isNaN(serviceId)) {
    notFound()
  }

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (error || !service) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/services">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour aux services
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
              <p className="text-gray-600 mt-1">{service.short_description}</p>
            </div>
            <div className="flex gap-2">
              <DuplicateServiceButton
                serviceId={service.id}
                serviceName={service.name}
              />
              <Link href={`/admin/services/${service.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier les détails
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">Informations</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Catégorie</p>
                    <p className="text-base font-medium text-gray-900 capitalize">{service.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type de service</p>
                    <p className="text-base font-medium text-gray-900">
                      {service.service_type === 'at_home' && 'À domicile'}
                      {service.service_type === 'at_location' && 'En institut'}
                      {service.service_type === 'hybrid' && 'Hybride'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prix de base</p>
                    <p className="text-base font-medium text-gray-900">{(service.base_price / 100).toFixed(0)}€</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Durée</p>
                    <p className="text-base font-medium text-gray-900">{service.base_duration_minutes} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {service.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      {service.is_featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Mis en avant
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Description complète</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{service.description}</p>
              </div>
            </div>
          </div>

          {/* Tabbed Interface Section */}
          <div className="lg:col-span-2">
            <ServiceDetailTabs
              serviceId={service.id}
              serviceName={service.name}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

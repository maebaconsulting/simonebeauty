'use client'

/**
 * Services List Page
 * Feature: 018-service-management-crud
 *
 * Admin page for listing and managing all services
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useServices, useDuplicateService, useBulkUpdateServices } from '@/hooks/useServiceCRUD'
import { useMarkets } from '@/hooks/useMarkets'
import { Briefcase, Plus, Loader2, Search, Filter, Copy, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { MarketBadges } from '@/components/admin/services/MarketBadges'
import Link from 'next/link'

export default function ServicesListPage() {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [marketFilter, setMarketFilter] = useState<number | null>(null)
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())

  const duplicateService = useDuplicateService()
  const bulkUpdateServices = useBulkUpdateServices()

  // Fetch markets for filter
  const { data: marketsData } = useMarkets({
    is_active: true,
    limit: 100,
  })
  const markets = marketsData?.data || []

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

  // Fetch services with filters
  const { data: servicesResult, isLoading } = useServices({
    search: search || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    market_id: marketFilter || undefined,
    limit: 100,
  })

  const services = servicesResult?.services || []
  const total = servicesResult?.total || 0

  const toggleServiceSelection = (serviceId: number) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedServices.size === services.length) {
      setSelectedServices(new Set())
    } else {
      setSelectedServices(new Set(services.map(s => s.id)))
    }
  }

  const handleBulkActivate = async () => {
    if (selectedServices.size === 0) return

    try {
      await bulkUpdateServices.mutateAsync({
        serviceIds: Array.from(selectedServices),
        updates: { is_active: true }
      })

      toast.success('Services activés', {
        description: `${selectedServices.size} service(s) activé(s).`,
      })

      setSelectedServices(new Set())
    } catch (error: any) {
      console.error('Error bulk activating:', error)
      toast.error('Erreur lors de l\'activation', {
        description: error.message,
      })
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedServices.size === 0) return

    try {
      await bulkUpdateServices.mutateAsync({
        serviceIds: Array.from(selectedServices),
        updates: { is_active: false }
      })

      toast.success('Services désactivés', {
        description: `${selectedServices.size} service(s) désactivé(s).`,
      })

      setSelectedServices(new Set())
    } catch (error: any) {
      console.error('Error bulk deactivating:', error)
      toast.error('Erreur lors de la désactivation', {
        description: error.message,
      })
    }
  }

  const handleDuplicate = async (serviceId: number, serviceName: string) => {
    const newName = prompt(
      `Dupliquer "${serviceName}".\n\nEntrez le nom du nouveau service:`,
      `${serviceName} (Copie)`
    )

    if (!newName || newName.trim() === '') {
      return
    }

    try {
      const result = await duplicateService.mutateAsync({
        source_service_id: serviceId,
        new_name: newName.trim(),
        copy_images: true,
        copy_supplements: false,
        copy_contractors: false,
      })

      toast.success('Service dupliqué', {
        description: `Le service "${result.name}" a été créé.`,
      })

      // Optionally redirect to edit the new service
      router.push(`/admin/services/${result.id}/edit`)
    } catch (error: any) {
      console.error('Error duplicating service:', error)
      toast.error('Erreur lors de la duplication', {
        description: error.message || 'Une erreur est survenue.',
      })
    }
  }

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

  if (!session || !profile || !['admin', 'manager'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des services</h1>
              <p className="text-gray-600 mt-1">
                {total} service{total > 1 ? 's' : ''} au total
              </p>
            </div>
            <Link href="/admin/services/new">
              <Button className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Créer un service
              </Button>
            </Link>
          </div>

          {/* Bulk Actions Bar */}
          {selectedServices.size > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {selectedServices.size} service(s) sélectionné(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkActivate}
                    disabled={bulkUpdateServices.isPending}
                  >
                    Activer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeactivate}
                    disabled={bulkUpdateServices.isPending}
                  >
                    Désactiver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedServices(new Set())}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mt-6 flex gap-4 flex-wrap">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                size="sm"
              >
                Actifs
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('inactive')}
                size="sm"
              >
                Inactifs
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={marketFilter || ''}
                onChange={(e) => setMarketFilter(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Tous les marchés</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.code} - {market.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {services.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun service trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {search || statusFilter !== 'all' || marketFilter
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par créer votre premier service.'}
            </p>
            {!search && statusFilter === 'all' && !marketFilter && (
              <Link href="/admin/services/new">
                <Button className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un service
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={services.length > 0 && selectedServices.size === services.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marchés
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => {
                  const priceDisplay = (service.base_price / 100).toFixed(0)
                  const statusClass = service.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                  const statusText = service.is_active ? 'Actif' : 'Inactif'

                  return (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedServices.has(service.id)}
                          onCheckedChange={() => toggleServiceSelection(service.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {service.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {service.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {priceDisplay} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.base_duration_minutes} min
                      </td>
                      <td className="px-6 py-4">
                        <MarketBadges markets={(service as any).markets || []} maxVisible={3} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Modifier
                        </Link>
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Images
                        </Link>
                        <button
                          onClick={() => handleDuplicate(service.id, service.name)}
                          className="text-green-600 hover:text-green-900"
                          disabled={duplicateService.isPending}
                        >
                          Dupliquer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

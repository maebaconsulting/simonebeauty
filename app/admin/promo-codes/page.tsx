'use client'

/**
 * Promo Codes List Page
 * Feature: 015-promo-codes-system
 *
 * Admin page for listing and managing promo codes
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  usePromoCodes,
  useDeletePromoCode,
  useTogglePromoCodeActive
} from '@/hooks/usePromoCodes'
import {
  getPromoCodeStatus,
  getPromoStatusLabel,
  getPromoStatusColor
} from '@/lib/utils/promo-status'
import { formatPromoDiscount } from '@/lib/utils/promo-formatting'
import { Tag, Plus, Loader2, Search, Trash2, Edit, Power } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { PromoCode } from '@/types/promo-code'

export default function PromoCodesListPage() {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const deletePromoCode = useDeletePromoCode()
  const togglePromoActive = useTogglePromoCodeActive()

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

  // Fetch promo codes with filters
  const { data: promoCodesResult, isLoading } = usePromoCodes(
    {
      search: search || undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    },
    {
      page: 1,
      page_size: 50,
      sort_by: 'created_at',
      sort_order: 'desc',
    }
  )

  const promoCodes = promoCodesResult?.data || []
  const total = promoCodesResult?.pagination.total_items || 0

  const handleDelete = async (promoCode: PromoCode) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le code promo "${promoCode.code}" ?\n\n` +
      `Cette action est irréversible et peut échouer si le code a déjà été utilisé.`
    )

    if (!confirmed) return

    try {
      await deletePromoCode.mutateAsync(promoCode.id)

      toast.success('Code promo supprimé', {
        description: `Le code "${promoCode.code}" a été supprimé.`,
      })
    } catch (error: any) {
      console.error('Error deleting promo code:', error)
      toast.error('Erreur lors de la suppression', {
        description: error.message || 'Une erreur est survenue.',
      })
    }
  }

  const handleToggleActive = async (promoCode: PromoCode) => {
    const newStatus = !promoCode.is_active

    try {
      await togglePromoActive.mutateAsync({
        id: promoCode.id,
        isActive: newStatus,
      })

      toast.success(
        newStatus ? 'Code promo activé' : 'Code promo désactivé',
        {
          description: `Le code "${promoCode.code}" a été ${newStatus ? 'activé' : 'désactivé'}.`,
        }
      )
    } catch (error: any) {
      console.error('Error toggling promo code:', error)
      toast.error('Erreur lors de la modification', {
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
              <h1 className="text-3xl font-bold text-gray-900">Codes Promotionnels</h1>
              <p className="text-gray-600 mt-1">
                {total} code{total > 1 ? 's' : ''} promo au total
              </p>
            </div>
            <Link href="/admin/promo-codes/new">
              <Button className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Créer un code promo
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-6 flex gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un code promo..."
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {promoCodes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun code promo trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {search || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par créer votre premier code promo.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link href="/admin/promo-codes/new">
                <Button className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un code promo
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Valeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validité
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
                {promoCodes.map((promo) => {
                  const status = getPromoCodeStatus(promo)
                  const statusLabel = getPromoStatusLabel(status)
                  const statusColors = getPromoStatusColor(status)
                  const discountDisplay = formatPromoDiscount(promo.discount_type, promo.discount_value)

                  const usesDisplay = promo.max_uses
                    ? `${promo.uses_count} / ${promo.max_uses}`
                    : `${promo.uses_count} (illimité)`

                  const validUntilDisplay = promo.valid_until
                    ? new Date(promo.valid_until).toLocaleDateString('fr-FR')
                    : 'Aucune'

                  return (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono font-bold text-gray-900">
                          {promo.code}
                        </div>
                        {promo.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                            {promo.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{discountDisplay}</div>
                        {promo.max_discount_amount && (
                          <div className="text-xs text-gray-500">
                            Max: {(promo.max_discount_amount / 100).toFixed(2)} €
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {usesDisplay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{validUntilDisplay}</div>
                        {promo.first_booking_only && (
                          <div className="text-xs text-blue-600 mt-1">1ère réservation</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <Link
                          href={`/admin/promo-codes/${promo.id}/edit`}
                          className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleActive(promo)}
                          className={`${
                            promo.is_active
                              ? 'text-orange-600 hover:text-orange-900'
                              : 'text-green-600 hover:text-green-900'
                          } inline-flex items-center`}
                          disabled={togglePromoActive.isPending}
                          title={promo.is_active ? 'Désactiver' : 'Activer'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          disabled={deletePromoCode.isPending}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
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

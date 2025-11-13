'use client'

/**
 * Admin Promo Codes List Page
 * Feature: 015-promo-codes-system
 * User Story 2: Admin CRUD Management
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PromoCodeList } from '@/components/promo-codes/PromoCodeList'
import { PromoCodeFilters } from '@/components/promo-codes/PromoCodeFilters'
import { usePromoCodes } from '@/hooks/usePromoCodes'
import type { PromoCodeFilters as Filters } from '@/types/promo-filters'
import { Plus, Tag } from 'lucide-react'
import Link from 'next/link'

export default function PromoCodesPage() {
  const [filters, setFilters] = useState<Filters>({})
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, refetch } = usePromoCodes(filters, {
    page,
    page_size: pageSize,
  })

  const promoCodes = data?.data || []
  const pagination = data?.pagination

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(1) // Reset to page 1 when filters change
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Codes Promotionnels
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gérer les codes promo de la plateforme
                </p>
              </div>
            </div>

            <Link href="/admin/promotions/new">
              <Button className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau code promo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          {pagination && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total codes</div>
                <div className="text-2xl font-bold text-gray-900">
                  {pagination.total_items}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Actifs</div>
                <div className="text-2xl font-bold text-green-900">
                  {promoCodes.filter(p => p.is_active).length}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-700 mb-1">Utilisations totales</div>
                <div className="text-2xl font-bold text-orange-900">
                  {promoCodes.reduce((sum, p) => sum + p.uses_count, 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <PromoCodeFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table */}
        <PromoCodeList
          promoCodes={promoCodes}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.total_pages}
              {' • '}
              {pagination.total_items} code(s) au total
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!pagination.has_previous}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                disabled={!pagination.has_next}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

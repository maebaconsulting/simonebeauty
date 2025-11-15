/**
 * PromoCodeFilters Component
 * Feature: 015-promo-codes-system
 *
 * Filter controls for promo codes list
 */

'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, Filter, X } from 'lucide-react'
import type { PromoCodeFilters as Filters } from '@/types/promo-filters'
import type { DiscountType, PromoCodeStatus } from '@/types/promo-code'

interface PromoCodeFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onClearFilters: () => void
}

export function PromoCodeFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: PromoCodeFiltersProps) {
  const hasActiveFilters =
    filters.is_active !== undefined ||
    filters.discount_type !== undefined ||
    filters.search !== undefined

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
    })
  }

  const handleActiveChange = (value: string) => {
    onFiltersChange({
      ...filters,
      is_active: value === 'all' ? undefined : value === 'true',
    })
  }

  const handleDiscountTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      discount_type: value === 'all' ? undefined : (value as DiscountType),
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtres</h3>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2">
            Recherche
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Code ou description..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2">
            Statut
          </Label>
          <select
            id="status"
            value={
              filters.is_active === undefined
                ? 'all'
                : filters.is_active
                ? 'true'
                : 'false'
            }
            onChange={(e) => handleActiveChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-button-primary focus:border-transparent"
          >
            <option value="all">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>

        {/* Discount Type Filter */}
        <div>
          <Label htmlFor="discount_type" className="text-sm font-medium text-gray-700 mb-2">
            Type de réduction
          </Label>
          <select
            id="discount_type"
            value={filters.discount_type || 'all'}
            onChange={(e) => handleDiscountTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-button-primary focus:border-transparent"
          >
            <option value="all">Tous</option>
            <option value="percentage">Pourcentage (%)</option>
            <option value="fixed_amount">Montant fixe (€)</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Filtres actifs:</span>

            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Recherche: "{filters.search}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.is_active !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                {filters.is_active ? 'Actifs' : 'Inactifs'}
                <button
                  onClick={() => handleActiveChange('all')}
                  className="hover:bg-green-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.discount_type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                {filters.discount_type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                <button
                  onClick={() => handleDiscountTypeChange('all')}
                  className="hover:bg-purple-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

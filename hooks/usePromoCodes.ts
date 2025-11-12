/**
 * usePromoCodes Hook
 * Feature: 015-promo-codes-system
 *
 * React Query hooks for promo code CRUD operations (Admin)
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPromoCodes,
  fetchPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeActive,
} from '@/lib/supabase/queries/promo-codes'
import type { PromoCode } from '@/types/promo-code'
import type { PromoCodeFilters, PaginationParams } from '@/types/promo-filters'
import type { PromoCodeFormSubmit } from '@/types/promo-form'

/**
 * Query keys for React Query
 */
export const promoCodesKeys = {
  all: ['promo-codes'] as const,
  lists: () => [...promoCodesKeys.all, 'list'] as const,
  list: (filters: PromoCodeFilters, pagination: PaginationParams) =>
    [...promoCodesKeys.lists(), { filters, pagination }] as const,
  details: () => [...promoCodesKeys.all, 'detail'] as const,
  detail: (id: number) => [...promoCodesKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of promo codes
 */
export function usePromoCodes(
  filters: PromoCodeFilters = {},
  pagination: PaginationParams = { page: 1, page_size: 20 }
) {
  return useQuery({
    queryKey: promoCodesKeys.list(filters, pagination),
    queryFn: () => fetchPromoCodes(filters, pagination),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch a single promo code by ID
 */
export function usePromoCode(id: number | null) {
  return useQuery({
    queryKey: promoCodesKeys.detail(id!),
    queryFn: () => fetchPromoCodeById(id!),
    enabled: id !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to create a new promo code
 */
export function useCreatePromoCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PromoCodeFormSubmit) => createPromoCode(data),
    onSuccess: () => {
      // Invalidate all promo code lists
      queryClient.invalidateQueries({ queryKey: promoCodesKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to create promo code:', error)
    },
  })
}

/**
 * Hook to update an existing promo code
 */
export function useUpdatePromoCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<PromoCodeFormSubmit>
    }) => updatePromoCode(id, data),
    onSuccess: (updatedPromo) => {
      // Update the detail query
      queryClient.setQueryData(
        promoCodesKeys.detail(updatedPromo.id),
        updatedPromo
      )

      // Invalidate all lists to refresh
      queryClient.invalidateQueries({ queryKey: promoCodesKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to update promo code:', error)
    },
  })
}

/**
 * Hook to delete a promo code
 */
export function useDeletePromoCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deletePromoCode(id),
    onSuccess: (_, deletedId) => {
      // Remove the detail query
      queryClient.removeQueries({ queryKey: promoCodesKeys.detail(deletedId) })

      // Invalidate all lists to refresh
      queryClient.invalidateQueries({ queryKey: promoCodesKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to delete promo code:', error)
    },
  })
}

/**
 * Hook to toggle promo code active status
 */
export function useTogglePromoCodeActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      togglePromoCodeActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: promoCodesKeys.detail(id) })

      // Snapshot the previous value
      const previousPromo = queryClient.getQueryData<PromoCode>(
        promoCodesKeys.detail(id)
      )

      // Optimistically update the detail query
      if (previousPromo) {
        queryClient.setQueryData(promoCodesKeys.detail(id), {
          ...previousPromo,
          is_active: isActive,
        })
      }

      // Return context with snapshot
      return { previousPromo }
    },
    onSuccess: (updatedPromo) => {
      // Update the detail query with the actual data
      queryClient.setQueryData(
        promoCodesKeys.detail(updatedPromo.id),
        updatedPromo
      )

      // Invalidate all lists to refresh
      queryClient.invalidateQueries({ queryKey: promoCodesKeys.lists() })
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousPromo) {
        queryClient.setQueryData(
          promoCodesKeys.detail(id),
          context.previousPromo
        )
      }
      console.error('Failed to toggle promo code status:', error)
    },
  })
}

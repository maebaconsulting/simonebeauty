/**
 * Hooks: Service Supplements Management
 * Feature: Service Supplements
 *
 * React Query hooks for managing service supplements (add-ons, options, etc.)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Types
export interface ServiceSupplement {
  id: number
  service_id: number
  name: string
  description: string | null
  type: 'duration' | 'product' | 'addon' | 'option'
  price_adjustment: number // in cents
  duration_adjustment: number // in minutes
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface CreateSupplementData {
  name: string
  description?: string
  type: 'duration' | 'product' | 'addon' | 'option'
  price_adjustment?: number // in cents
  duration_adjustment?: number // in minutes
  is_active?: boolean
  display_order?: number
}

export interface UpdateSupplementData {
  supplement_id: number
  name?: string
  description?: string
  type?: 'duration' | 'product' | 'addon' | 'option'
  price_adjustment?: number // in cents
  duration_adjustment?: number // in minutes
  is_active?: boolean
  display_order?: number
}

/**
 * Hook to fetch supplements for a service
 */
export function useServiceSupplements(serviceId: number) {
  return useQuery({
    queryKey: ['service-supplements', serviceId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/services/${serviceId}/supplements`)

      if (!response.ok) {
        throw new Error('Failed to fetch service supplements')
      }

      const data = await response.json()
      return data.supplements as ServiceSupplement[]
    },
    enabled: !!serviceId && serviceId > 0,
  })
}

/**
 * Hook to create a new supplement for a service
 */
export function useCreateSupplement(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSupplementData) => {
      const response = await fetch(`/api/admin/services/${serviceId}/supplements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create supplement')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['service-supplements', serviceId] })
    },
  })
}

/**
 * Hook to update a supplement
 */
export function useUpdateSupplement(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateSupplementData) => {
      const response = await fetch(`/api/admin/services/${serviceId}/supplements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update supplement')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['service-supplements', serviceId] })
    },
  })
}

/**
 * Hook to delete a supplement
 */
export function useDeleteSupplement(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (supplementId: number) => {
      const response = await fetch(
        `/api/admin/services/${serviceId}/supplements?supplement_id=${supplementId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete supplement')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['service-supplements', serviceId] })
    },
  })
}

/**
 * Hook to reorder supplements (batch update display_order)
 */
export function useReorderSupplements(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (supplements: Array<{ id: number; display_order: number }>) => {
      // Update all supplements in sequence
      const promises = supplements.map((supplement) =>
        fetch(`/api/admin/services/${serviceId}/supplements`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supplement_id: supplement.id,
            display_order: supplement.display_order,
          }),
        }).then((res) => {
          if (!res.ok) {
            throw new Error('Failed to reorder supplements')
          }
          return res.json()
        })
      )

      return Promise.all(promises)
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['service-supplements', serviceId] })
    },
  })
}

/**
 * Hooks: Service Contractors Management
 * Feature: Service Contractors Association
 *
 * React Query hooks for managing contractor-service associations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Types
export interface ContractorService {
  id: number
  contractor_id: string
  is_active: boolean | null
  custom_price: number | null
  custom_duration: number | null
  custom_description: string | null
  added_at: string | null
  updated_at: string | null
  contractors: {
    id: string
    business_name: string | null
    professional_title: string | null
    is_active: boolean | null
    profiles: {
      first_name: string | null
      last_name: string | null
      avatar_url: string | null
    } | null
  } | null
}

export interface AvailableContractor {
  id: string
  business_name: string | null
  professional_title: string | null
  is_active: boolean | null
  profile: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

export interface AssignContractorData {
  contractor_id: string
  custom_price?: number
  custom_duration?: number
  custom_description?: string
}

export interface UpdateContractorAssignmentData {
  contractor_id: string
  is_active?: boolean
  custom_price?: number | null
  custom_duration?: number | null
  custom_description?: string | null
}

/**
 * Hook to fetch contractors associated with a service
 */
export function useServiceContractors(serviceId: number) {
  return useQuery({
    queryKey: ['service-contractors', serviceId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/services/${serviceId}/contractors`)

      if (!response.ok) {
        throw new Error('Failed to fetch service contractors')
      }

      const data = await response.json()
      return data.contractors as ContractorService[]
    },
    enabled: !!serviceId && serviceId > 0,
  })
}

/**
 * Hook to fetch all available contractors (for assignment modal)
 */
export function useAvailableContractors() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['available-contractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select(`
          id,
          business_name,
          professional_title,
          is_active,
          profiles:id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('business_name', { ascending: true })

      if (error) {
        console.error('Error fetching available contractors:', error)
        throw error
      }

      return (data || []) as AvailableContractor[]
    },
  })
}

/**
 * Hook to assign a contractor to a service
 */
export function useAssignContractor(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignContractorData) => {
      const response = await fetch(`/api/admin/services/${serviceId}/contractors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign contractor')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['service-contractors', serviceId] })
    },
  })
}

/**
 * Hook to update a contractor-service association
 */
export function useUpdateContractorAssignment(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateContractorAssignmentData) => {
      const response = await fetch(`/api/admin/services/${serviceId}/contractors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update contractor assignment')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['service-contractors', serviceId] })
    },
  })
}

/**
 * Hook to unassign a contractor from a service
 */
export function useUnassignContractor(serviceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contractorId: string) => {
      const response = await fetch(
        `/api/admin/services/${serviceId}/contractors?contractor_id=${contractorId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unassign contractor')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['service-contractors', serviceId] })
    },
  })
}

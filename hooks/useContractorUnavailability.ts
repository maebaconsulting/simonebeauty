/**
 * React Query Hooks for Contractor Unavailability Management
 * Feature: 007-contractor-interface
 * Tasks: T057-T061
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ContractorUnavailability, UnavailabilityReason, RecurrencePattern } from '@/types/contractor'

export const contractorUnavailabilityKeys = {
  all: ['contractor-unavailability'] as const,
  byContractor: (contractorId: number) => [...contractorUnavailabilityKeys.all, contractorId] as const,
}

interface CreateUnavailabilityParams {
  contractor_id: number
  start_datetime: string // ISO 8601 format
  end_datetime: string // ISO 8601 format
  reason?: string
  reason_type: UnavailabilityReason
  is_recurring?: boolean
  recurrence_pattern?: RecurrencePattern
  recurrence_end_date?: string // YYYY-MM-DD format
}

/**
 * Fetch contractor's unavailabilities
 */
export function useContractorUnavailabilities(contractorId: number | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: contractorUnavailabilityKeys.byContractor(contractorId || 0),
    queryFn: async (): Promise<ContractorUnavailability[]> => {
      if (!contractorId) {
        throw new Error('Contractor ID is required')
      }

      // Call Edge Function to get contractor unavailabilities
      const { data, error } = await supabase.functions.invoke('get-contractor-unavailabilities', {
        body: { contractor_id: contractorId },
      })

      if (error) {
        console.error('Error fetching contractor unavailabilities:', error)
        throw error
      }

      return data?.unavailabilities || []
    },
    enabled: !!contractorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Create a new unavailability
 */
export function useCreateUnavailability() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (params: CreateUnavailabilityParams) => {
      const { data, error } = await supabase.functions.invoke('create-unavailability', {
        body: params,
      })

      if (error) {
        console.error('Error creating unavailability:', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate contractor unavailability query
      queryClient.invalidateQueries({
        queryKey: contractorUnavailabilityKeys.byContractor(variables.contractor_id),
      })
    },
  })
}

/**
 * Delete an unavailability
 */
export function useDeleteUnavailability() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      contractorId,
      unavailabilityId,
    }: {
      contractorId: number
      unavailabilityId: number
    }) => {
      const { data, error } = await supabase.functions.invoke('delete-unavailability', {
        body: {
          unavailability_id: unavailabilityId,
        },
      })

      if (error) {
        console.error('Error deleting unavailability:', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate contractor unavailability query
      queryClient.invalidateQueries({
        queryKey: contractorUnavailabilityKeys.byContractor(variables.contractorId),
      })
    },
  })
}

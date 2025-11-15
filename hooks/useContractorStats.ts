/**
 * Contractor Statistics Hook
 * Feature: 007-contractor-interface
 *
 * Fetches key metrics for contractor dashboard using TanStack Query
 */

import { useQuery } from '@tanstack/react-query'

export interface ContractorStats {
  pending_requests: number
  today_bookings: number
  month_revenue: number
  profile_completion: number
}

interface ContractorStatsResponse {
  success: boolean
  data: ContractorStats
}

/**
 * Hook to fetch contractor dashboard statistics
 * Includes: pending requests, today's bookings, month revenue, profile completion
 */
export function useContractorStats() {
  return useQuery<ContractorStats>({
    queryKey: ['contractor-stats'],
    queryFn: async () => {
      const response = await fetch('/api/contractor/stats')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch contractor stats')
      }

      const result: ContractorStatsResponse = await response.json()
      return result.data
    },
    refetchInterval: 60000, // Refetch every minute to keep stats fresh
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}

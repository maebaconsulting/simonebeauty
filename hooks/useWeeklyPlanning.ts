/**
 * React Query Hook for Weekly Planning with Realtime Subscription
 * Feature: 007-contractor-interface
 * Tasks: T062-T063
 *
 * Fetches weekly planning and subscribes to real-time updates
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { WeeklyPlanning, ContractorBooking } from '@/types/contractor'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export const weeklyPlanningKeys = {
  all: ['weekly-planning'] as const,
  byContractor: (contractorId: number, weekStart: string) =>
    [...weeklyPlanningKeys.all, contractorId, weekStart] as const,
}

/**
 * Fetch weekly planning for a contractor
 * Includes Realtime subscription for booking updates
 */
export function useWeeklyPlanning(
  contractorId: number | null,
  weekDate: Date = new Date()
) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Calculate week boundaries (Monday to Sunday)
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 }) // Sunday
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

  const query = useQuery({
    queryKey: weeklyPlanningKeys.byContractor(contractorId || 0, weekStartStr),
    queryFn: async (): Promise<WeeklyPlanning> => {
      if (!contractorId) {
        throw new Error('Contractor ID is required')
      }

      // Call Edge Function to get weekly planning
      const { data, error } = await supabase.functions.invoke('get-weekly-planning', {
        body: {
          contractor_id: contractorId,
          week_start: weekStartStr,
          week_end: weekEndStr,
        },
      })

      if (error) {
        console.error('Error fetching weekly planning:', error)
        throw error
      }

      return {
        week_start: weekStartStr,
        week_end: weekEndStr,
        bookings: data?.bookings || [],
      }
    },
    enabled: !!contractorId,
    staleTime: 1 * 60 * 1000, // 1 minute (shorter due to Realtime)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes as backup
  })

  // Set up Realtime subscription for bookings (T063)
  useEffect(() => {
    if (!contractorId) return

    console.log('📡 Setting up Realtime subscription for contractor bookings:', contractorId)

    // Subscribe to appointment_bookings table changes
    const channel = supabase
      .channel(`contractor-bookings-${contractorId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointment_bookings',
          filter: `contractor_id=eq.${contractorId}`,
        },
        (payload) => {
          console.log('📨 Realtime booking change:', payload)

          // Invalidate and refetch planning data
          queryClient.invalidateQueries({
            queryKey: weeklyPlanningKeys.byContractor(contractorId, weekStartStr),
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      console.log('🔌 Unsubscribing from contractor bookings:', contractorId)
      supabase.removeChannel(channel)
    }
  }, [contractorId, weekStartStr, queryClient, supabase])

  return {
    ...query,
    weekStart,
    weekEnd,
    weekStartStr,
    weekEndStr,
  }
}

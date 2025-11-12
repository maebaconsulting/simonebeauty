/**
 * React Query Hooks for Contractor Schedule Management
 * Feature: 007-contractor-interface
 * Tasks: T049-T056
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ContractorSchedule, WeeklySchedule, TimeRange, DayOfWeek } from '@/types/contractor'
import { formatTimeForDatabase } from '@/lib/validations/schedule-validation'

export const contractorScheduleKeys = {
  all: ['contractor-schedule'] as const,
  byContractor: (contractorId: number) => [...contractorScheduleKeys.all, contractorId] as const,
}

/**
 * Fetch contractor's schedule organized by day of week
 */
export function useContractorSchedule(contractorId: number | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: contractorScheduleKeys.byContractor(contractorId || 0),
    queryFn: async (): Promise<WeeklySchedule> => {
      if (!contractorId) {
        throw new Error('Contractor ID is required')
      }

      // Call Edge Function to get contractor schedule
      const { data, error } = await supabase.functions.invoke('get-contractor-schedule', {
        body: { contractor_id: contractorId },
      })

      if (error) {
        console.error('Error fetching contractor schedule:', error)
        throw error
      }

      // Organize schedule by day of week
      const weeklySchedule: WeeklySchedule = {
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
      }

      const dayMapping: Record<number, keyof WeeklySchedule> = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      }

      if (data?.schedules) {
        data.schedules.forEach((schedule: ContractorSchedule) => {
          const dayKey = dayMapping[schedule.day_of_week]
          if (dayKey) {
            weeklySchedule[dayKey].push(schedule)
          }
        })
      }

      return weeklySchedule
    },
    enabled: !!contractorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Create a new schedule entry
 */
export function useCreateScheduleEntry() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      contractorId,
      dayOfWeek,
      timeRange,
    }: {
      contractorId: number
      dayOfWeek: DayOfWeek
      timeRange: TimeRange
    }) => {
      const { data, error } = await supabase.functions.invoke('create-schedule-entry', {
        body: {
          contractor_id: contractorId,
          day_of_week: dayOfWeek,
          start_time: formatTimeForDatabase(timeRange.start),
          end_time: formatTimeForDatabase(timeRange.end),
          is_recurring: true,
          effective_from: new Date().toISOString().split('T')[0], // Today
        },
      })

      if (error) {
        console.error('Error creating schedule entry:', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate contractor schedule query
      queryClient.invalidateQueries({
        queryKey: contractorScheduleKeys.byContractor(variables.contractorId),
      })
    },
  })
}

/**
 * Update an existing schedule entry
 */
export function useUpdateScheduleEntry() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      contractorId,
      scheduleId,
      timeRange,
    }: {
      contractorId: number
      scheduleId: number
      timeRange: TimeRange
    }) => {
      const { data, error } = await supabase.functions.invoke('update-schedule-entry', {
        body: {
          schedule_id: scheduleId,
          start_time: formatTimeForDatabase(timeRange.start),
          end_time: formatTimeForDatabase(timeRange.end),
        },
      })

      if (error) {
        console.error('Error updating schedule entry:', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate contractor schedule query
      queryClient.invalidateQueries({
        queryKey: contractorScheduleKeys.byContractor(variables.contractorId),
      })
    },
  })
}

/**
 * Delete (soft delete) a schedule entry
 */
export function useDeleteScheduleEntry() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      contractorId,
      scheduleId,
    }: {
      contractorId: number
      scheduleId: number
    }) => {
      const { data, error } = await supabase.functions.invoke('delete-schedule-entry', {
        body: {
          schedule_id: scheduleId,
        },
      })

      if (error) {
        console.error('Error deleting schedule entry:', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate contractor schedule query
      queryClient.invalidateQueries({
        queryKey: contractorScheduleKeys.byContractor(variables.contractorId),
      })
    },
  })
}

/**
 * Get contractor ID from current user profile
 */
export function useCurrentContractor() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['current-contractor'] as const,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return null
      }

      // Fetch contractor record from contractors table
      const { data: contractor, error } = await supabase
        .from('contractors')
        .select('id, is_active, is_verified')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching contractor:', error)
        return null
      }

      return contractor
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

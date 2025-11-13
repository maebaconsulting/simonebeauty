/**
 * Contractor Bookings Hooks
 * Tasks: T078, T080
 * Feature: 007-contractor-interface
 *
 * React Query hooks for managing contractor bookings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Booking } from '@/components/contractor/BookingCard'
import type { BookingRequest } from '@/types/contractor'

const supabase = createClient()

// Query keys
export const contractorBookingsKeys = {
  all: ['contractor-bookings'] as const,
  pending: (contractorId: string) => ['contractor-bookings', 'pending', contractorId] as const,
  upcoming: (contractorId: string) => ['contractor-bookings', 'upcoming', contractorId] as const,
  past: (contractorId: string) => ['contractor-bookings', 'past', contractorId] as const,
  awaiting: (contractorId: string) => ['contractor-bookings', 'awaiting-payment', contractorId] as const,
}

/**
 * Fetch pending booking requests for a contractor
 */
export function usePendingRequests(contractorId: string | undefined) {
  return useQuery({
    queryKey: contractorBookingsKeys.pending(contractorId || ''),
    queryFn: async () => {
      if (!contractorId) throw new Error('Contractor ID is required')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-pending-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ contractor_id: contractorId }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch pending requests')
      }

      const result = await response.json()

      // Debug logging
      console.log('📥 Received pending requests:', result)
      if (result.requests && result.requests.length > 0) {
        console.log('📦 First request booking data:', result.requests[0].booking)
        console.log('🔍 scheduled_datetime:', result.requests[0].booking?.scheduled_datetime)
      }

      return result.requests as BookingRequest[]
    },
    enabled: !!contractorId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Accept a booking request
 */
export function useAcceptRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, contractorId }: { requestId: number; contractorId: string }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/accept-booking-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ request_id: requestId, contractor_id: contractorId }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept booking request')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate pending requests
      queryClient.invalidateQueries({ queryKey: contractorBookingsKeys.pending(variables.contractorId) })
      // Invalidate upcoming bookings
      queryClient.invalidateQueries({ queryKey: contractorBookingsKeys.upcoming(variables.contractorId) })
    },
  })
}

/**
 * Refuse a booking request
 */
export function useRefuseRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      requestId,
      contractorId,
      refusalReason,
      contractorMessage,
    }: {
      requestId: number
      contractorId: string
      refusalReason: string
      contractorMessage?: string
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/refuse-booking-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            request_id: requestId,
            contractor_id: contractorId,
            refusal_reason: refusalReason,
            contractor_message: contractorMessage,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to refuse booking request')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate pending requests
      queryClient.invalidateQueries({ queryKey: contractorBookingsKeys.pending(variables.contractorId) })
    },
  })
}

/**
 * Mark a service as completed
 */
export function useMarkServiceCompleted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookingId, contractorId }: { bookingId: number; contractorId: string }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mark-service-completed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            booking_id: bookingId,
            contractor_id: contractorId,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark service as completed')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate upcoming and past bookings
      queryClient.invalidateQueries({ queryKey: contractorBookingsKeys.upcoming(variables.contractorId) })
      queryClient.invalidateQueries({ queryKey: contractorBookingsKeys.past(variables.contractorId) })
      queryClient.invalidateQueries({ queryKey: contractorBookingsKeys.awaiting(variables.contractorId) })
    },
  })
}

/**
 * Fetch upcoming bookings (confirmed or in_progress)
 */
export function useUpcomingBookings(contractorId: string | undefined) {
  return useQuery({
    queryKey: contractorBookingsKeys.upcoming(contractorId || ''),
    queryFn: async () => {
      if (!contractorId) throw new Error('Contractor ID is required')

      const { data, error } = await supabase
        .from('appointment_bookings')
        .select('*')
        .eq('contractor_id', contractorId)
        .in('status', ['confirmed', 'in_progress'])
        .gte('scheduled_datetime', new Date().toISOString())
        .order('scheduled_datetime', { ascending: true })

      if (error) throw error

      return data as Booking[]
    },
    enabled: !!contractorId,
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Fetch past bookings (completed or cancelled)
 */
export function usePastBookings(contractorId: string | undefined) {
  return useQuery({
    queryKey: contractorBookingsKeys.past(contractorId || ''),
    queryFn: async () => {
      if (!contractorId) throw new Error('Contractor ID is required')

      const { data, error } = await supabase
        .from('appointment_bookings')
        .select('*')
        .eq('contractor_id', contractorId)
        .in('status', ['completed', 'cancelled'])
        .order('scheduled_datetime', { ascending: false })
        .limit(50) // Limit to most recent 50

      if (error) throw error

      return data as Booking[]
    },
    enabled: !!contractorId,
  })
}

/**
 * Fetch bookings awaiting payment (completed but not yet paid to contractor)
 */
export function useAwaitingPaymentBookings(contractorId: string | undefined) {
  return useQuery({
    queryKey: contractorBookingsKeys.awaiting(contractorId || ''),
    queryFn: async () => {
      if (!contractorId) throw new Error('Contractor ID is required')

      const { data, error } = await supabase
        .from('appointment_bookings')
        .select('*')
        .eq('contractor_id', contractorId)
        .eq('status', 'completed')
        .is('contractor_paid_at', null) // Not yet paid to contractor
        .order('completed_at', { ascending: true })

      if (error) throw error

      return data as Booking[]
    },
    enabled: !!contractorId,
    refetchInterval: 120000, // Refetch every 2 minutes
  })
}

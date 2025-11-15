// React Query Hooks for Booking Session
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingSessionRepository } from '@/lib/repositories/booking-session-repository'
import type {
  DbBookingSession,
  DbBookingSessionInsert,
  DbBookingSessionUpdate,
} from '@/types/database'

// Query Keys
export const bookingSessionKeys = {
  all: ['bookingSession'] as const,
  details: () => [...bookingSessionKeys.all, 'detail'] as const,
  detail: (sessionId: string) => [...bookingSessionKeys.details(), sessionId] as const,
  withRelations: (sessionId: string) => [...bookingSessionKeys.all, 'relations', sessionId] as const,
  active: (clientId: string) => [...bookingSessionKeys.all, 'active', clientId] as const,
}

/**
 * Get current booking session by session ID
 */
export function useBookingSession(sessionId: string | null) {
  return useQuery({
    queryKey: bookingSessionKeys.detail(sessionId || ''),
    queryFn: () => {
      if (!sessionId) return null
      return bookingSessionRepository.getSessionByUuid(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}

/**
 * Get booking session with all related data
 */
export function useBookingSessionWithRelations(sessionId: string | null) {
  return useQuery({
    queryKey: bookingSessionKeys.withRelations(sessionId || ''),
    queryFn: () => {
      if (!sessionId) return null
      return bookingSessionRepository.getSessionWithRelations(sessionId)
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000,
  })
}

/**
 * Get active sessions for a client
 */
export function useActiveSessions(clientId: string) {
  return useQuery({
    queryKey: bookingSessionKeys.active(clientId),
    queryFn: () => bookingSessionRepository.getActiveSessions(clientId),
    enabled: !!clientId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Create a new booking session
 */
export function useCreateBookingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (session: DbBookingSessionInsert) =>
      bookingSessionRepository.createSession(session),
    onSuccess: (data) => {
      // Set in cache
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)

      // Invalidate active sessions list (only for authenticated users)
      if (data.client_id) {
        queryClient.invalidateQueries({
          queryKey: bookingSessionKeys.active(data.client_id),
        })
      }
    },
  })
}

/**
 * Update booking session
 */
export function useUpdateBookingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: string; updates: DbBookingSessionUpdate }) =>
      bookingSessionRepository.updateSession(sessionId, updates),
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)

      // Invalidate relations query
      queryClient.invalidateQueries({
        queryKey: bookingSessionKeys.withRelations(data.session_id),
      })
    },
  })
}

/**
 * Update session step
 */
export function useUpdateSessionStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, step }: { sessionId: string; step: 1 | 2 | 3 | 4 }) =>
      bookingSessionRepository.updateStep(sessionId, step),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
    },
  })
}

/**
 * Update service selection (Step 1)
 */
export function useUpdateServiceSelection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, serviceId }: { sessionId: string; serviceId: number }) =>
      bookingSessionRepository.updateServiceSelection(sessionId, serviceId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
      queryClient.invalidateQueries({
        queryKey: bookingSessionKeys.withRelations(data.session_id),
      })
    },
  })
}

/**
 * Update address selection (Step 2)
 */
export function useUpdateAddressSelection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, addressId }: { sessionId: string; addressId: number }) =>
      bookingSessionRepository.updateAddressSelection(sessionId, addressId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
      queryClient.invalidateQueries({
        queryKey: bookingSessionKeys.withRelations(data.session_id),
      })
    },
  })
}

/**
 * Update timeslot selection (Step 3)
 */
export function useUpdateTimeslotSelection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      timeslot,
      contractorId,
    }: {
      sessionId: string
      timeslot: { date: string; start_time: string; end_time: string; contractor_id?: string }
      contractorId?: string
    }) => bookingSessionRepository.updateTimeslotSelection(sessionId, timeslot, contractorId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
      queryClient.invalidateQueries({
        queryKey: bookingSessionKeys.withRelations(data.session_id),
      })
    },
  })
}

/**
 * Update contractor selection (Step 3.5 - between timeslot and confirmation)
 */
export function useUpdateContractorSelection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, contractorId }: { sessionId: string; contractorId: string }) =>
      bookingSessionRepository.updateContractorSelection(sessionId, contractorId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
      queryClient.invalidateQueries({
        queryKey: bookingSessionKeys.withRelations(data.session_id),
      })
    },
  })
}

/**
 * Delete booking session
 */
export function useDeleteBookingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => bookingSessionRepository.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: bookingSessionKeys.detail(sessionId) })
      queryClient.removeQueries({ queryKey: bookingSessionKeys.withRelations(sessionId) })
    },
  })
}

/**
 * Refresh session expiration
 */
export function useRefreshSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => bookingSessionRepository.refreshExpiration(sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
    },
  })
}

// ============================================================================
// GUEST SESSION HOOKS
// ============================================================================

/**
 * Create a guest booking session (no authentication required)
 */
export function useCreateGuestSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ guestEmail, source = 'catalog' }: { guestEmail: string; source?: import('@/types/database').BookingSource }) =>
      bookingSessionRepository.createGuestSession(guestEmail, source),
    onSuccess: (data) => {
      // Set in cache
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
    },
  })
}

/**
 * Update guest address (store in session JSONB field)
 */
export function useUpdateGuestAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      address,
    }: {
      sessionId: string
      address: {
        street: string
        city: string
        postal_code: string
        country?: string // ISO 3166-1 alpha-2 country code
        latitude?: number
        longitude?: number
        building_info?: string
      }
    }) => bookingSessionRepository.updateGuestAddress(sessionId, address),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
      queryClient.invalidateQueries({
        queryKey: bookingSessionKeys.withRelations(data.session_id),
      })
    },
  })
}

/**
 * Migrate guest session to authenticated user session
 */
export function useMigrateGuestSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      userId,
      addressId,
    }: {
      sessionId: string
      userId: string
      addressId?: number
    }) => bookingSessionRepository.migrateGuestSession(sessionId, userId, addressId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingSessionKeys.detail(data.session_id), data)
      queryClient.invalidateQueries({
        queryKey: bookingSessionKeys.withRelations(data.session_id),
      })
      if (data.client_id) {
        queryClient.invalidateQueries({
          queryKey: bookingSessionKeys.active(data.client_id),
        })
      }
    },
  })
}

/**
 * Save guest address to user profile
 */
export function useSaveGuestAddressToProfile() {
  return useMutation({
    mutationFn: ({
      userId,
      address,
    }: {
      userId: string
      address: {
        street: string
        city: string
        postal_code: string
        country?: string // ISO 3166-1 alpha-2 country code
        latitude?: number
        longitude?: number
        building_info?: string
      }
    }) => bookingSessionRepository.saveGuestAddressToProfile(userId, address),
  })
}

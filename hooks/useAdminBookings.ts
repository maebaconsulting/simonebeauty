/**
 * Admin Bookings Hooks
 * Feature: Admin Back Office - Booking Management
 * SpecKit: spec 005 User Stories 5 & 9
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminBookingWithDetails,
  AdminBookingDetails,
  AdminBookingFilters,
  ManualCaptureRequest,
  ManualCaptureResponse,
  CancellationRequest,
  CancellationResponse,
  BookingStats,
} from '@/types/booking';

/**
 * Fetch paginated list of bookings with filters
 * FR-016: Rechercher et filtrer les réservations
 */
export function useAdminBookings(filters?: AdminBookingFilters) {
  return useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters?.payment_status && filters.payment_status !== 'all') {
        params.append('payment_status', filters.payment_status);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        params.append('date_to', filters.date_to);
      }
      if (filters?.contractor_id) {
        params.append('contractor_id', filters.contractor_id);
      }
      if (filters?.page) {
        params.append('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await fetch(`/api/admin/bookings?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bookings');
      }

      const data = await response.json();
      return {
        bookings: data.data as AdminBookingWithDetails[],
        pagination: data.pagination,
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch single booking details with action logs
 * FR-017: Consulter détails d'une réservation
 */
export function useAdminBooking(bookingId: number | string) {
  return useQuery({
    queryKey: ['admin-booking', bookingId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch booking');
      }

      const data = await response.json();
      return data.data as AdminBookingDetails;
    },
    enabled: !!bookingId,
  });
}

/**
 * Manual capture payment mutation
 * FR-031: Admin peut forcer capture manuelle
 */
export function useCapturePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ManualCaptureRequest & { bookingId: number }) => {
      const { bookingId, ...body } = request;

      const response = await fetch(`/api/admin/bookings/${bookingId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to capture payment');
      }

      return (await response.json()) as ManualCaptureResponse;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-booking', data.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
    },
  });
}

/**
 * Cancel booking mutation
 * Uses existing /api/bookings/[id]/cancel endpoint with admin privileges
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CancellationRequest) => {
      const { booking_id, ...body } = request;

      const response = await fetch(`/api/bookings/${booking_id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel booking');
      }

      return (await response.json()) as CancellationResponse;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-booking', data.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-booking-stats'] });
    },
  });
}

/**
 * Fetch booking statistics for dashboard
 * @param market_id - Optional market ID to filter stats by market
 */
export function useBookingStats(market_id?: number | null) {
  return useQuery({
    queryKey: ['admin-booking-stats', market_id],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams();
      params.set('limit', '1000');
      if (market_id) {
        params.set('market_id', market_id.toString());
      }

      const response = await fetch(`/api/admin/bookings?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch booking stats');
      }

      const data = await response.json();
      const bookings = data.data as AdminBookingWithDetails[];

      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

      const stats: BookingStats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        in_progress: bookings.filter(b => b.status === 'in_progress').length,
        completed_today: bookings.filter(b => {
          if (b.status !== 'completed') return false;
          const bookingDate = new Date(b.scheduled_datetime).toLocaleDateString('en-CA', {
            timeZone: b.booking_timezone || 'Europe/Paris'
          }); // Format: YYYY-MM-DD
          return bookingDate === today;
        }).length,
        cancelled_today: bookings.filter(b =>
          b.status === 'cancelled' && b.cancelled_at?.startsWith(today)
        ).length,
        total_revenue_today: bookings
          .filter(b => {
            if (b.status !== 'completed') return false;
            const bookingDate = new Date(b.scheduled_datetime).toLocaleDateString('en-CA', {
              timeZone: b.booking_timezone || 'Europe/Paris'
            });
            return bookingDate === today;
          })
          .reduce((sum, b) => sum + b.service_amount, 0),
        total_revenue_month: bookings
          .filter(b => {
            if (b.status !== 'completed') return false;
            const bookingDate = new Date(b.scheduled_datetime).toLocaleDateString('en-CA', {
              timeZone: b.booking_timezone || 'Europe/Paris'
            });
            return bookingDate.startsWith(thisMonth);
          })
          .reduce((sum, b) => sum + b.service_amount, 0),
      };

      return stats;
    },
    staleTime: 60000, // 1 minute
  });
}

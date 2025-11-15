// Booking Flow Types

export interface Service {
  id: string
  name: string
  category: string
  description: string
  duration: number // minutes (maps to base_duration_minutes in DB)
  base_price: number // in cents (13500 = 135€) - matches DB column name
  image_url: string
  is_active: boolean
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  icon?: string
}

export interface Address {
  id: string
  client_id: string
  type: 'home' | 'work' | 'other'
  label?: string
  street: string
  city: string
  postal_code: string
  country: string
  is_default: boolean
  latitude?: number
  longitude?: number
  created_at: string
}

export interface TimeSlot {
  date: string // ISO date
  start_time: string // HH:mm
  end_time: string // HH:mm
  contractor_id?: string
  available: boolean
}

export interface Contractor {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string
  rating?: number
  reviews_count?: number
  specialties: string[]
}

export interface BookingSession {
  // Step 1: Service selection
  service?: Service

  // Step 2: Address
  address?: Address

  // Step 3: Timeslot
  timeslot?: TimeSlot
  contractor?: Contractor

  // Step 4: Options (for future)
  additional_services?: Service[]
  promo_code?: string

  // Metadata
  session_id?: string
  created_at?: string
  expires_at?: string
  current_step: 1 | 2 | 3 | 4
}

export interface Booking {
  id: string
  client_id: string
  service_id: string
  contractor_id: string
  address_id: string
  scheduled_datetime: string // TIMESTAMPTZ in UTC
  booking_timezone: string // e.g., 'Europe/Paris'
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  payment_status: 'pending' | 'authorized' | 'captured' | 'refunded'
  created_at: string
  updated_at: string
}

export type BookingStatus = Booking['status']
export type PaymentStatus = Booking['payment_status']

// =============================================================================
// ADMIN BOOKING MANAGEMENT TYPES
// Feature: Admin Back Office - Booking Management
// SpecKit: spec 005 User Stories 5 & 9
// =============================================================================

/**
 * Extended Booking Status for Admin
 * Includes all workflow states including contractor completion
 */
export type AdminBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed_by_contractor'
  | 'completed'
  | 'cancelled'
  | 'refunded'

/**
 * Extended Payment Status for Admin
 */
export type AdminPaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'cancelled'

/**
 * Complete Admin Booking (matches appointment_bookings table exactly)
 */
export interface AdminBooking {
  id: number
  client_id: string | null
  contractor_id: string | null
  service_id: number

  // Scheduling
  scheduled_datetime: string // TIMESTAMPTZ in UTC
  booking_timezone: string // e.g., 'Europe/Paris'
  duration_minutes: number

  // Address
  service_address: string
  service_city: string | null
  service_postal_code: string | null
  service_latitude: number | null
  service_longitude: number | null

  // Pricing
  service_amount: number // Final amount charged
  service_amount_original: number | null // Original before promo

  // Promo code
  promo_code_id: number | null
  promo_discount_amount: number

  // Status
  status: AdminBookingStatus

  // Client info (cached)
  client_name: string | null
  client_phone: string | null
  client_email: string | null

  // Service info (cached)
  service_name: string | null

  // Payment (Stripe)
  stripe_payment_intent_id: string | null
  payment_status: AdminPaymentStatus | null
  stripe_customer_id: string | null

  // Stripe fees
  stripe_fee_service: number
  stripe_fee_tip: number

  // Tips
  tip_amount: number
  tip_transfer_id: string | null
  tip_processed_at: string | null

  // Travel time
  travel_time_before: number | null // minutes
  travel_time_after: number | null // minutes

  // Cancellation
  cancellation_reason: string | null
  cancelled_at: string | null

  // Timestamps
  completed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Admin Booking with joined profile and service data
 */
export interface AdminBookingWithDetails extends AdminBooking {
  // Client profile data
  client_profile?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
  }

  // Contractor profile data
  contractor_profile?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    professional_title: string | null
    avatar_url: string | null
  }

  // Service data
  service?: {
    name: string
    category: string | null
    duration_minutes: number
    base_price: number
  }

  // Contractor with market data
  contractor?: {
    market_id: number | null
    market: {
      id: number
      code: string
      name: string
      currency_code: string
    } | null
  }
}

/**
 * Service Action Log (from service_action_logs table)
 */
export interface ServiceActionLog {
  id: number
  booking_id: number
  action_type: string
  performed_by_type: 'client' | 'contractor' | 'admin' | 'system'
  performed_by_id: string | null
  metadata: Record<string, any>
  created_at: string
}

/**
 * Admin Booking Details with action history
 */
export interface AdminBookingDetails extends AdminBookingWithDetails {
  action_logs: ServiceActionLog[]
}

/**
 * Filters for admin booking list
 */
export interface AdminBookingFilters {
  status?: AdminBookingStatus | 'all'
  payment_status?: AdminPaymentStatus | 'all'
  search?: string // Search by client name, email, booking ID
  date_from?: string // DATE "YYYY-MM-DD"
  date_to?: string // DATE "YYYY-MM-DD"
  contractor_id?: string
  market_id?: number // Filter by contractor's market
  page?: number
  limit?: number
}

/**
 * Booking statistics for dashboard
 */
export interface BookingStats {
  total: number
  pending: number
  confirmed: number
  in_progress: number
  completed_today: number
  cancelled_today: number
  total_revenue_today: number
  total_revenue_month: number
}

/**
 * Manual Capture Request (User Story 9 - FR-031)
 */
export interface ManualCaptureRequest {
  booking_id: number
  amount_to_capture?: number // Optional: capture partial amount
  notify_parties?: boolean // Notify client + contractor
  admin_notes?: string
}

/**
 * Manual Capture Response
 */
export interface ManualCaptureResponse {
  success: boolean
  booking_id: number
  payment_intent_id: string
  amount_captured: number
  message: string
  error?: string
}

/**
 * Cancellation Request
 */
export interface CancellationRequest {
  booking_id: number
  cancellation_reason: string
  refund_amount?: number // null = full refund, 0 = no refund, number = partial refund
  notify_parties?: boolean
}

/**
 * Cancellation Response
 */
export interface CancellationResponse {
  success: boolean
  booking_id: number
  refund?: {
    id: string
    amount: number
  }
  payment_cancelled?: boolean
  message: string
  error?: string
}

/**
 * Refund Request
 */
export interface RefundRequest {
  booking_id: number
  refund_amount?: number // null = full refund, number = partial refund
  reason?: string
}

/**
 * Booking Update Request (for admin modifications)
 */
export interface BookingUpdateRequest {
  scheduled_datetime?: string // TIMESTAMPTZ in UTC
  booking_timezone?: string // e.g., 'Europe/Paris'
  contractor_id?: string
  status?: AdminBookingStatus
  admin_notes?: string
}

/**
 * Contractor Application Types
 * Feature: 007-contractor-interface
 */

export type ApplicationStatus = 'pending' | 'interview_scheduled' | 'approved' | 'rejected'

export type WorkFrequency = 'full_time' | 'part_time' | 'occasional'

export type InterviewMode = 'video' | 'phone' | 'in_person'

export interface ContractorApplication {
  id: number

  // Market Assignment (Feature 018)
  market_id: number // Geographic market for this application

  // Step 1: Personal Info
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string

  // Step 2: Professional Profile
  profession: string
  years_of_experience: number
  diplomas?: string
  specialties: number[] // Array of specialty IDs
  services_offered: string

  // Step 3: Availability
  geographic_zones: string[]
  preferred_schedule?: string
  work_frequency: WorkFrequency

  // Step 4: Motivation
  motivation: string

  // Step 5: Documents
  cv_file_path?: string
  certifications_file_paths?: string[]
  portfolio_file_paths?: string[]

  // Application Status
  status: ApplicationStatus
  submitted_at: string

  // Admin Review
  admin_comments?: string
  reviewed_by?: string
  reviewed_at?: string

  // Interview
  interview_date?: string
  interview_mode?: InterviewMode
  interview_notes?: string

  // Rejection
  rejection_reason?: string

  // Created contractor (if approved)
  created_contractor_id?: string
  approved_at?: string
}

export interface ContractorApplicationWithSpecialties extends ContractorApplication {
  specialty_names?: string[]
}

export interface ContractorApplicationFilters {
  status?: ApplicationStatus
  search?: string
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// Schedule & Availability Types (User Story 1 - Planning & Availability)
// ============================================================================

/**
 * Day of week enumeration (PostgreSQL convention)
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Contractor Schedule Entry
 * Represents a recurring time slot on a specific day of the week
 */
export interface ContractorSchedule {
  id: number
  contractor_id: number

  // Day and time
  day_of_week: DayOfWeek
  start_time: string // TIME format "HH:MM:SS"
  end_time: string   // TIME format "HH:MM:SS"

  // Recurrence
  is_recurring: boolean
  effective_from: string  // DATE format "YYYY-MM-DD"
  effective_until?: string | null // DATE format "YYYY-MM-DD"

  // Metadata
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Reason for unavailability
 */
export type UnavailabilityReason = 'vacation' | 'personal' | 'lunch_break' | 'sick' | 'other'

/**
 * Recurrence pattern for unavailabilities
 */
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly'

/**
 * Contractor Unavailability
 * Represents a blocked time slot (vacation, break, etc.)
 */
export interface ContractorUnavailability {
  id: number
  contractor_id: number

  // Time range
  start_datetime: string // TIMESTAMP format "YYYY-MM-DD HH:MM:SS"
  end_datetime: string   // TIMESTAMP format "YYYY-MM-DD HH:MM:SS"

  // Reason
  reason?: string
  reason_type: UnavailabilityReason

  // Recurrence
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern | null
  recurrence_end_date?: string | null // DATE format "YYYY-MM-DD"

  // Metadata
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Weekly schedule structure for UI
 * Maps day names to schedule entries
 */
export interface WeeklySchedule {
  monday: ContractorSchedule[]
  tuesday: ContractorSchedule[]
  wednesday: ContractorSchedule[]
  thursday: ContractorSchedule[]
  friday: ContractorSchedule[]
  saturday: ContractorSchedule[]
  sunday: ContractorSchedule[]
}

/**
 * Time range input (for forms)
 */
export interface TimeRange {
  start: string // HH:MM format
  end: string   // HH:MM format
}

// ============================================================================
// Booking & Planning Types (User Story 1 - Planning Calendar View)
// ============================================================================

/**
 * Booking status
 */
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Contractor Booking (simplified view for planning)
 */
export interface ContractorBooking {
  id: number
  client_id: string
  contractor_id: number
  service_id: number

  // Date and time
  scheduled_date: string // DATE format "YYYY-MM-DD"
  scheduled_start_time: string // TIME format "HH:MM:SS"
  scheduled_end_time: string // TIME format "HH:MM:SS"

  // Status
  status: BookingStatus

  // Client info (from join)
  client_name?: string
  client_address?: string

  // Service info (from join)
  service_name?: string
  service_duration?: number

  // Travel time (if calculated)
  travel_time_before?: number // minutes
  travel_time_after?: number // minutes

  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Weekly planning data
 */
export interface WeeklyPlanning {
  week_start: string // YYYY-MM-DD
  week_end: string // YYYY-MM-DD
  bookings: ContractorBooking[]
}

// ============================================================================
// Booking Requests Types (User Story 2 - Booking Management)
// ============================================================================

/**
 * Booking request status
 */
export type BookingRequestStatus = 'pending' | 'accepted' | 'refused' | 'expired'

/**
 * Booking request (pending validation by contractor)
 */
export interface BookingRequest {
  id: number
  booking_id: number
  contractor_id: string
  status: BookingRequestStatus

  // Timing
  requested_at: string // TIMESTAMP
  expires_at: string // TIMESTAMP
  responded_at?: string | null // TIMESTAMP

  // Response
  contractor_message?: string | null
  refusal_reason?: string | null

  // Related booking data (from join)
  booking?: {
    scheduled_datetime: string // TIMESTAMPTZ in UTC
    booking_timezone?: string // e.g., 'Europe/Paris'
    duration_minutes: number
    service_name?: string
    service_address?: string
    service_city?: string
    service_amount: number
    client_name?: string
    client_phone?: string
    client_email?: string
  }

  created_at: string
  updated_at: string
}

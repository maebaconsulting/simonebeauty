// Booking Flow Types

export interface Service {
  id: string
  name: string
  category: string
  description: string
  duration: number // minutes
  price: number // euros
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
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  payment_status: 'pending' | 'authorized' | 'captured' | 'refunded'
  created_at: string
  updated_at: string
}

export type BookingStatus = Booking['status']
export type PaymentStatus = Booking['payment_status']

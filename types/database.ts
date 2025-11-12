// Database Types - Correspond exactement aux tables Supabase
// Ces types représentent les structures de données telles qu'elles sont stockées en base

export type ServiceCategory = 'massage' | 'beauty' | 'hair' | 'health' | 'wellness' | 'other'
export type ServiceType = 'at_home' | 'at_location' | 'hybrid'
export type AddressType = 'home' | 'work' | 'other'
export type BookingStep = 1 | 2 | 3 | 4
export type BookingSource = 'catalog' | 'contractor_slug' | 'ready_to_go'

// Database table: services
// NOTE: All prices are stored in CENTS (e.g., 13500 = 135€)
export interface DbService {
  id: number
  name: string
  slug: string
  description: string
  short_description?: string
  category: ServiceCategory
  service_type: ServiceType
  base_price: number // In cents (13500 = 135€) - divide by 100 and use toFixed(0) for display
  base_duration_minutes: number // Column name in DB
  buffer_time_minutes: number
  image_url?: string
  gallery_image_urls?: string[]
  service_images?: DbServiceImage[] // Related images from service_images table
  is_active: boolean
  is_featured: boolean
  display_order: number
  is_enterprise_ready: boolean
  requires_ready_to_go: boolean
  created_at: string
  updated_at: string
}

// Database table: client_addresses
export interface DbClientAddress {
  id: number
  client_id: string // UUID from auth.users
  type: AddressType
  label?: string
  street: string
  city: string
  postal_code: string
  country: string
  latitude?: number
  longitude?: number
  building_info?: string
  delivery_instructions?: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// Database table: booking_sessions
export interface DbBookingSession {
  id: number
  session_id: string // UUID
  client_id?: string | null // UUID from auth.users (nullable for guests)
  service_id?: number
  address_id?: number
  contractor_id?: string // UUID from auth.users

  // Guest session fields
  is_guest?: boolean
  guest_email?: string | null
  guest_address?: {
    street: string
    city: string
    postal_code: string
    latitude?: number
    longitude?: number
    building_info?: string
  } | null

  // JSONB fields
  timeslot?: {
    date: string
    start_time: string
    end_time: string
    contractor_id?: string
  }
  additional_services?: number[] // Array of service IDs
  pricing_breakdown?: {
    base_price: number
    service_amount: number
    promo_discount: number
    gift_card_amount: number
    final_amount: number
  }

  // Promo & Gift Cards
  promo_code_id?: number
  promo_code?: string
  promo_discount_amount: number
  gift_card_id?: number
  gift_card_code?: string
  gift_card_amount: number

  // Flow tracking
  current_step: BookingStep
  source: BookingSource
  contractor_slug?: string
  contractor_locked: boolean

  // Expiration
  expires_at: string
  last_activity_at: string
  created_at: string
  updated_at: string
}

// Insert types (for creating new records - no id, timestamps)
export type DbServiceInsert = Omit<DbService, 'id' | 'created_at' | 'updated_at'>
export type DbClientAddressInsert = Omit<DbClientAddress, 'id' | 'created_at' | 'updated_at'>
export type DbBookingSessionInsert = Omit<DbBookingSession, 'id' | 'created_at' | 'updated_at' | 'last_activity_at'>

// Update types (for updating records - all optional except id)
export type DbServiceUpdate = Partial<Omit<DbService, 'id' | 'created_at'>>
export type DbClientAddressUpdate = Partial<Omit<DbClientAddress, 'id' | 'created_at'>>
export type DbBookingSessionUpdate = Partial<Omit<DbBookingSession, 'id' | 'session_id' | 'client_id' | 'created_at'>>

// View types (for reading from joins/views)
export interface DbServiceWithCategory extends DbService {
  category_name?: string
  category_icon?: string
}

export interface DbBookingSessionWithRelations extends DbBookingSession {
  service?: DbService
  address?: DbClientAddress
  contractor?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

// ============================================================================
// IMAGE MANAGEMENT TYPES (Feature 017)
// ============================================================================

export type VariantType = 'color' | 'size' | 'material' | 'style' | 'other'
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'under_review'
export type ConversationStatus = 'active' | 'closed' | 'archived'

// Database table: products (placeholder for future e-commerce feature)
export interface DbProduct {
  id: number
  name: string
  description?: string | null
  price_cents?: number | null
  category?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// Database table: product_variants
export interface DbProductVariant {
  id: number
  product_id: number
  variant_name: string
  variant_type: VariantType
  sku?: string | null
  created_at: string
}

// Database table: service_images
export interface DbServiceImage {
  id: number
  service_id: number
  storage_path: string
  display_order: number
  is_primary: boolean
  alt_text: string
  uploaded_by: string // UUID
  uploaded_at: string
  file_size_bytes: number
  width?: number | null
  height?: number | null
  deleted_at?: string | null
}

// Database table: product_images
export interface DbProductImage {
  id: number
  product_id: number
  variant_id?: number | null
  storage_path: string
  display_order: number
  is_primary: boolean
  alt_text: string
  uploaded_by: string // UUID
  uploaded_at: string
  file_size_bytes: number
  width?: number | null
  height?: number | null
  deleted_at?: string | null
}

// Database table: conversations
export interface DbConversation {
  id: number
  booking_id?: number | null
  subject?: string | null
  status: ConversationStatus
  created_at: string
  updated_at: string
  closed_at?: string | null
}

// Database table: conversation_attachments
export interface DbConversationAttachment {
  id: number
  conversation_id: number
  booking_id?: number | null
  uploaded_by_user_id: string // UUID
  storage_path: string
  alt_text?: string | null
  moderation_status: ModerationStatus
  moderated_by?: string | null // UUID
  moderated_at?: string | null
  moderation_reason?: string | null
  file_size_bytes: number
  uploaded_at: string
  deleted_at?: string | null
}

// Insert types for image management tables
export type DbProductInsert = Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>
export type DbProductVariantInsert = Omit<DbProductVariant, 'id' | 'created_at'>
export type DbServiceImageInsert = Omit<DbServiceImage, 'id' | 'uploaded_at'>
export type DbProductImageInsert = Omit<DbProductImage, 'id' | 'uploaded_at'>
export type DbConversationInsert = Omit<DbConversation, 'id' | 'created_at' | 'updated_at'>
export type DbConversationAttachmentInsert = Omit<DbConversationAttachment, 'id' | 'uploaded_at'>

// Update types for image management tables
export type DbProductUpdate = Partial<Omit<DbProduct, 'id' | 'created_at'>>
export type DbProductVariantUpdate = Partial<Omit<DbProductVariant, 'id' | 'created_at'>>
export type DbServiceImageUpdate = Partial<Omit<DbServiceImage, 'id' | 'uploaded_at'>>
export type DbProductImageUpdate = Partial<Omit<DbProductImage, 'id' | 'uploaded_at'>>
export type DbConversationUpdate = Partial<Omit<DbConversation, 'id' | 'created_at'>>
export type DbConversationAttachmentUpdate = Partial<Omit<DbConversationAttachment, 'id' | 'uploaded_at'>>

// View types with relations
export interface DbServiceImageWithRelations extends DbServiceImage {
  service?: DbService
  uploader?: {
    id: string
    first_name: string
    last_name: string
  }
  public_url?: string
}

export interface DbProductImageWithRelations extends DbProductImage {
  product?: DbProduct
  variant?: DbProductVariant
  uploader?: {
    id: string
    first_name: string
    last_name: string
  }
  public_url?: string
}

export interface DbConversationAttachmentWithRelations extends DbConversationAttachment {
  conversation?: DbConversation
  uploader?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  moderator?: {
    id: string
    first_name: string
    last_name: string
  }
  public_url?: string
}

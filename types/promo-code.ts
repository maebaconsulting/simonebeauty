/**
 * Promo Code Types
 * Feature: 015-promo-codes-system
 *
 * Base types for promo codes system
 */

// Discount types
export type DiscountType = 'percentage' | 'fixed_amount'

// Promo code status (computed)
export type PromoCodeStatus =
  | 'active'           // Currently valid and usable
  | 'inactive'         // Disabled by admin
  | 'expired'          // Past valid_until date
  | 'exhausted'        // Reached max_uses limit
  | 'scheduled'        // Future valid_from date

// Main promo code interface
export interface PromoCode {
  id: number

  // Code information
  code: string
  description: string | null

  // Discount configuration
  discount_type: DiscountType
  discount_value: number  // 20 for 20% or 10 for 10€
  max_discount_amount: number | null  // Cap for percentage discounts (e.g., max 50€)

  // Usage limits
  max_uses: number | null  // null = unlimited
  uses_count: number
  max_uses_per_user: number  // Default: 1

  // Validity period
  valid_from: string  // ISO timestamp
  valid_until: string | null  // ISO timestamp or null for no expiry

  // Restrictions
  min_order_amount: number | null  // Minimum order to apply promo
  first_booking_only: boolean
  specific_services: number[] | null  // null = all services
  specific_categories: number[] | null  // null = all categories

  // Status
  is_active: boolean

  // Metadata
  created_by: string | null  // UUID
  created_at: string
  updated_at: string
}

// Promo code usage tracking
export interface PromoCodeUsage {
  id: number
  promo_code_id: number
  booking_id: number
  user_id: string  // UUID

  // Amounts
  original_amount: number  // Original price before discount
  discount_amount: number  // Amount discounted (platform absorbs this)
  final_amount: number     // Final price paid by client

  used_at: string  // ISO timestamp
}

// Applied promo (client state)
export interface AppliedPromo {
  code: string
  discount_type: DiscountType
  discount_value: number
  discount_amount: number  // Calculated discount for current booking
  final_amount: number     // Final price after discount
}

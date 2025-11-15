/**
 * Promo Validation Types
 * Feature: 015-promo-codes-system
 *
 * Types for promo code validation
 */

// Validation request parameters
// Note: is_first_booking is automatically detected by the RPC function
export interface ValidatePromoParams {
  code: string
  user_id: string | null  // null for guest users
  service_id: number
  service_amount: number  // in cents (converted to euros in query layer)
}

// Validation result from RPC function
export interface PromoValidationResult {
  valid: boolean
  error_code?: string
  error_message?: string

  // If valid, include discount info
  promo_code_id?: number
  discount_type?: 'percentage' | 'fixed_amount'
  discount_value?: number
  discount_amount?: number  // Calculated discount
  final_amount?: number     // Amount after discount
  max_discount_amount?: number | null
}

// Validation error codes
export type PromoErrorCode =
  | 'invalid_code'           // Code doesn't exist
  | 'code_inactive'          // Code is disabled
  | 'code_expired'           // Past valid_until
  | 'code_not_yet_valid'     // Before valid_from
  | 'code_exhausted'         // Reached max_uses
  | 'user_limit_reached'     // User already used max_uses_per_user
  | 'min_amount_not_met'     // Order below min_order_amount
  | 'service_not_eligible'   // Service not in specific_services
  | 'category_not_eligible'  // Service category not in specific_categories
  | 'first_booking_only'     // Code restricted to first booking
  | 'rate_limit_exceeded'    // Too many validation attempts

// Applied promo (for checkout)
export interface AppliedPromo {
  promo_code_id: number
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  discount_amount: number  // Actual discount for this booking
  final_amount: number
}

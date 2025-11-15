/**
 * Promo Filters Types
 * Feature: 015-promo-codes-system
 *
 * Types for filtering and pagination of promo codes
 */

import type { DiscountType, PromoCodeStatus } from './promo-code'

// Filters for promo code list
export interface PromoCodeFilters {
  // Status filters
  is_active?: boolean
  status?: PromoCodeStatus | PromoCodeStatus[]

  // Type filter
  discount_type?: DiscountType

  // Search
  search?: string  // Search in code or description

  // Date range
  created_after?: string  // ISO timestamp
  created_before?: string  // ISO timestamp

  // Validity
  valid_now?: boolean  // Currently valid (not expired, not scheduled)

  // Usage
  has_uses?: boolean  // Only codes that have been used
}

// Pagination parameters
export interface PaginationParams {
  page: number      // 1-indexed
  page_size: number // items per page

  // Sorting
  sort_by?: 'created_at' | 'updated_at' | 'uses_count' | 'code' | 'valid_until'
  sort_order?: 'asc' | 'desc'
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    page_size: number
    total_items: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
}

// Combined filters and pagination
export interface PromoCodeQuery extends PromoCodeFilters, PaginationParams {}

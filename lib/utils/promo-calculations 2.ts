/**
 * Promo Calculations Utilities
 * Feature: 015-promo-codes-system
 *
 * Helper functions for calculating discounts and amounts
 */

import type { DiscountType } from '@/types/promo-code'

/**
 * Calculate discount amount based on promo code configuration
 *
 * @param discountType - 'percentage' or 'fixed_amount'
 * @param discountValue - The discount value (e.g., 20 for 20% or 10 for 10€)
 * @param originalAmount - Original service amount before discount
 * @param maxDiscountAmount - Optional cap for percentage discounts (e.g., max 50€)
 * @returns The calculated discount amount in cents
 */
export function calculateDiscount(
  discountType: DiscountType,
  discountValue: number,
  originalAmount: number,
  maxDiscountAmount?: number | null
): number {
  let discountAmount: number

  if (discountType === 'percentage') {
    // Calculate percentage discount
    discountAmount = Math.floor((originalAmount * discountValue) / 100)

    // Apply cap if specified
    if (maxDiscountAmount !== null && maxDiscountAmount !== undefined) {
      discountAmount = Math.min(discountAmount, maxDiscountAmount)
    }
  } else {
    // Fixed amount discount
    discountAmount = discountValue
  }

  // Discount cannot exceed original amount (service can't be negative)
  discountAmount = Math.min(discountAmount, originalAmount)

  // Ensure positive amount
  return Math.max(0, Math.floor(discountAmount))
}

/**
 * Calculate final amount after discount
 *
 * @param originalAmount - Original service amount
 * @param discountAmount - Calculated discount amount
 * @returns Final amount after discount
 */
export function calculateFinalAmount(
  originalAmount: number,
  discountAmount: number
): number {
  return Math.max(0, originalAmount - discountAmount)
}

/**
 * Calculate ROI percentage for analytics
 *
 * @param totalRevenue - Total revenue generated with promos
 * @param totalPlatformCost - Total cost absorbed by platform
 * @returns ROI percentage
 */
export function calculateROI(
  totalRevenue: number,
  totalPlatformCost: number
): number {
  if (totalPlatformCost === 0) {
    return 0
  }
  return ((totalRevenue - totalPlatformCost) / totalPlatformCost) * 100
}

/**
 * Format discount as human-readable string
 *
 * @param discountType - 'percentage' or 'fixed_amount'
 * @param discountValue - The discount value
 * @returns Formatted discount string (e.g., "20%" or "10€")
 */
export function formatDiscount(
  discountType: DiscountType,
  discountValue: number
): string {
  if (discountType === 'percentage') {
    return `${discountValue}%`
  }
  return `${(discountValue / 100).toFixed(0)}€`
}

/**
 * Format amount in cents to euros
 *
 * @param amountInCents - Amount in cents
 * @returns Formatted string (e.g., "100,00€")
 */
export function formatAmount(amountInCents: number): string {
  const euros = amountInCents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros)
}

/**
 * Calculate discount summary for display
 *
 * @param originalAmount - Original service amount
 * @param discountType - Type of discount
 * @param discountValue - Discount value
 * @param maxDiscountAmount - Optional cap
 * @returns Summary object with all calculated values
 */
export function calculateDiscountSummary(
  originalAmount: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscountAmount?: number | null
) {
  const discountAmount = calculateDiscount(
    discountType,
    discountValue,
    originalAmount,
    maxDiscountAmount
  )
  const finalAmount = calculateFinalAmount(originalAmount, discountAmount)
  const savingsPercentage = originalAmount > 0
    ? (discountAmount / originalAmount) * 100
    : 0

  return {
    originalAmount,
    discountAmount,
    finalAmount,
    savingsPercentage,
    formattedOriginal: formatAmount(originalAmount),
    formattedDiscount: formatAmount(discountAmount),
    formattedFinal: formatAmount(finalAmount),
  }
}

/**
 * Promo Formatting Utilities
 * Feature: 015-promo-codes-system
 *
 * Helper functions for formatting promo code display
 */

import type { DiscountType, PromoCodeStatus } from '@/types/promo-code'
import { getPromoStatusLabel, getPromoStatusColor } from './promo-status'

/**
 * Format promo discount for display
 *
 * @param discountType - 'percentage' or 'fixed_amount'
 * @param discountValue - Discount value (20 for 20% or 10€)
 * @returns Formatted string (e.g., "20%" or "10€")
 */
export function formatPromoDiscount(
  discountType: DiscountType,
  discountValue: number
): string {
  if (discountType === 'percentage') {
    return `${discountValue}%`
  }
  // Fixed amount - convert cents to euros
  return `${(discountValue / 100).toFixed(0)}€`
}

/**
 * Format promo status for display with color
 *
 * @param status - PromoCodeStatus
 * @returns Object with label and color classes
 */
export function formatPromoStatus(status: PromoCodeStatus) {
  return {
    label: getPromoStatusLabel(status),
    colors: getPromoStatusColor(status),
  }
}

/**
 * Format date range for promo validity
 *
 * @param validFrom - ISO timestamp
 * @param validUntil - ISO timestamp or null
 * @returns Formatted date range string
 */
export function formatPromoDateRange(
  validFrom: string,
  validUntil: string | null
): string {
  const fromDate = new Date(validFrom)
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const fromStr = formatter.format(fromDate)

  if (!validUntil) {
    return `Du ${fromStr} (sans limite)`
  }

  const untilDate = new Date(validUntil)
  const untilStr = formatter.format(untilDate)

  return `Du ${fromStr} au ${untilStr}`
}

/**
 * Format uses count for display
 *
 * @param usesCount - Current uses
 * @param maxUses - Maximum uses (null = unlimited)
 * @returns Formatted string (e.g., "5/10" or "5 (illimité)")
 */
export function formatPromoUses(
  usesCount: number,
  maxUses: number | null
): string {
  if (maxUses === null) {
    return `${usesCount} (illimité)`
  }
  return `${usesCount}/${maxUses}`
}

/**
 * Format restriction summary for display
 *
 * @param minOrderAmount - Minimum order amount (in cents)
 * @param firstBookingOnly - First booking restriction
 * @param specificServices - Service IDs (null = all)
 * @param specificCategories - Category IDs (null = all)
 * @returns Array of restriction strings
 */
export function formatPromoRestrictions(
  minOrderAmount: number | null,
  firstBookingOnly: boolean,
  specificServices: number[] | null,
  specificCategories: number[] | null
): string[] {
  const restrictions: string[] = []

  if (minOrderAmount) {
    restrictions.push(`Minimum ${(minOrderAmount / 100).toFixed(0)}€`)
  }

  if (firstBookingOnly) {
    restrictions.push('Première réservation uniquement')
  }

  if (specificServices && specificServices.length > 0) {
    restrictions.push(`${specificServices.length} service(s) spécifique(s)`)
  }

  if (specificCategories && specificCategories.length > 0) {
    restrictions.push(`${specificCategories.length} catégorie(s) spécifique(s)`)
  }

  return restrictions.length > 0 ? restrictions : ['Aucune restriction']
}

/**
 * Get friendly error message for promo error code
 *
 * @param errorCode - Error code from validation
 * @returns User-friendly error message in French
 */
export function getPromoErrorMessage(errorCode: string | undefined): string {
  const errorMessages: Record<string, string> = {
    invalid_code: 'Ce code promo n\'existe pas',
    code_inactive: 'Ce code promo est actuellement désactivé',
    code_expired: 'Ce code promo a expiré',
    code_not_yet_valid: 'Ce code promo n\'est pas encore valide',
    code_exhausted: 'Ce code promo a atteint sa limite d\'utilisation',
    user_limit_reached: 'Vous avez déjà utilisé ce code promo',
    min_amount_not_met: 'Le montant minimum requis n\'est pas atteint',
    service_not_eligible: 'Ce code promo n\'est pas valable pour ce service',
    category_not_eligible: 'Ce code promo n\'est pas valable pour cette catégorie',
    first_booking_only: 'Ce code est réservé à votre première réservation',
    rate_limit_exceeded: 'Trop de tentatives. Veuillez réessayer dans quelques minutes',
  }

  return errorMessages[errorCode || ''] || 'Code promo invalide'
}

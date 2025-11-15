/**
 * Promo Status Utilities
 * Feature: 015-promo-codes-system
 *
 * Helper functions for determining promo code status
 */

import type { PromoCode, PromoCodeStatus } from '@/types/promo-code'

/**
 * Determine the current status of a promo code
 * Status is computed based on: is_active, validity dates, and usage limits
 */
export function getPromoCodeStatus(promo: PromoCode): PromoCodeStatus {
  const now = new Date()

  // Check if inactive (disabled by admin)
  if (!promo.is_active) {
    return 'inactive'
  }

  // Check if scheduled (future valid_from)
  const validFrom = new Date(promo.valid_from)
  if (now < validFrom) {
    return 'scheduled'
  }

  // Check if expired (past valid_until)
  if (promo.valid_until) {
    const validUntil = new Date(promo.valid_until)
    if (now > validUntil) {
      return 'expired'
    }
  }

  // Check if exhausted (reached max_uses)
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return 'exhausted'
  }

  // Otherwise, it's active
  return 'active'
}

/**
 * Check if a promo code is currently usable
 */
export function isPromoCodeUsable(promo: PromoCode): boolean {
  return getPromoCodeStatus(promo) === 'active'
}

/**
 * Get human-readable status label (French)
 */
export function getPromoStatusLabel(status: PromoCodeStatus): string {
  const labels: Record<PromoCodeStatus, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    expired: 'Expiré',
    exhausted: 'Épuisé',
    scheduled: 'Programmé',
  }
  return labels[status]
}

/**
 * Get status badge color (for UI)
 */
export function getPromoStatusColor(status: PromoCodeStatus): {
  bg: string
  text: string
  border: string
} {
  const colors: Record<PromoCodeStatus, { bg: string; text: string; border: string }> = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
    },
    inactive: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
    },
    expired: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
    },
    exhausted: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
    },
    scheduled: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
  }
  return colors[status]
}

/**
 * Get remaining uses for a promo code
 * Returns null if unlimited
 */
export function getRemainingUses(promo: PromoCode): number | null {
  if (promo.max_uses === null) {
    return null // Unlimited
  }
  return Math.max(0, promo.max_uses - promo.uses_count)
}

/**
 * Get usage percentage (for progress bars)
 * Returns null if unlimited
 */
export function getUsagePercentage(promo: PromoCode): number | null {
  if (promo.max_uses === null) {
    return null
  }
  if (promo.max_uses === 0) {
    return 100
  }
  return Math.min(100, (promo.uses_count / promo.max_uses) * 100)
}

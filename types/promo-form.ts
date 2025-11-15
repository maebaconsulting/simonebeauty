/**
 * Promo Form Types
 * Feature: 015-promo-codes-system
 *
 * Types and schemas for promo code forms (admin)
 */

import { z } from 'zod'

// Zod schema for promo code creation/editing
export const promoCodeFormSchema = z.object({
  // Code information
  code: z.string()
    .min(3, 'Le code doit contenir au moins 3 caractères')
    .max(50, 'Le code ne peut pas dépasser 50 caractères')
    .regex(/^[A-Z0-9_-]+$/, 'Le code ne peut contenir que des lettres majuscules, chiffres, tirets et underscores')
    .transform(val => val.toUpperCase()),

  description: z.string().optional(),

  // Discount configuration
  discount_type: z.enum(['percentage', 'fixed_amount']),
  discount_value: z.number()
    .positive('La valeur doit être positive')
    .refine((val) => {
      // If percentage, must be <= 100
      return true // Will be checked conditionally based on discount_type
    }),

  max_discount_amount: z.number().positive().nullable().optional(),

  // Usage limits
  max_uses: z.number().int().positive().nullable().optional(),
  max_uses_per_user: z.number().int().positive(),

  // Validity period
  valid_from: z.date(),
  valid_until: z.date().nullable().optional(),

  // Restrictions
  min_order_amount: z.number().positive().nullable().optional(),
  first_booking_only: z.boolean(),
  specific_services: z.array(z.number()).nullable().optional(),
  specific_categories: z.array(z.number()).nullable().optional(),
  specific_markets: z.array(z.number()).nullable().optional(),

  // Status
  is_active: z.boolean(),
}).superRefine((data, ctx) => {
  // Validate percentage <= 100
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le pourcentage ne peut pas dépasser 100%',
      path: ['discount_value'],
    })
  }

  // Validate valid_until > valid_from
  if (data.valid_until && data.valid_until <= data.valid_from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date de fin doit être postérieure à la date de début',
      path: ['valid_until'],
    })
  }
})

// Inferred TypeScript type from schema
export type PromoCodeFormData = z.infer<typeof promoCodeFormSchema>

// Form data with string dates (for API submission)
export interface PromoCodeFormSubmit {
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  max_discount_amount?: number | null
  max_uses?: number | null
  max_uses_per_user: number
  valid_from: string  // ISO timestamp
  valid_until?: string | null  // ISO timestamp
  min_order_amount?: number | null
  first_booking_only: boolean
  specific_services?: number[] | null
  specific_categories?: number[] | null
  specific_markets?: number[] | null
  is_active: boolean
}

/**
 * Helper function to transform PromoCodeFormData to PromoCodeFormSubmit
 * Converts Date objects to ISO string timestamps
 */
export function transformFormDataToSubmit(
  formData: PromoCodeFormData
): PromoCodeFormSubmit {
  return {
    ...formData,
    valid_from: formData.valid_from.toISOString(),
    valid_until: formData.valid_until?.toISOString() || null,
  }
}

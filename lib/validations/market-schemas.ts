/**
 * Zod validation schemas for market management
 * Feature: 018-international-market-segmentation
 */

import { z } from 'zod';
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
  SUPPORTED_LANGUAGE_CODES,
} from '@/types/market';

/**
 * Market code validation (ISO 3166-1 alpha-2)
 * Examples: FR, BE, CH, ES, DE
 */
const marketCodeSchema = z
  .string()
  .min(2, 'Code marché doit faire 2-3 caractères')
  .max(3, 'Code marché doit faire 2-3 caractères')
  .regex(/^[A-Z]{2,3}$/, 'Code marché invalide (format: FR, BE, CH)')
  .toUpperCase();

/**
 * Currency code validation (ISO 4217)
 * Constrained to supported currencies in database
 */
const currencyCodeSchema = z.enum(SUPPORTED_CURRENCIES, {
  errorMap: () => ({
    message: `Devise non supportée. Valeurs autorisées: ${SUPPORTED_CURRENCIES.join(', ')}`,
  }),
});

/**
 * Timezone validation (IANA timezone identifiers)
 * Constrained to supported timezones in database
 */
const timezoneSchema = z.enum(SUPPORTED_TIMEZONES, {
  errorMap: () => ({
    message: `Fuseau horaire non supporté. Valeurs autorisées: ${SUPPORTED_TIMEZONES.slice(0, 5).join(', ')}, etc.`,
  }),
});

/**
 * Language codes validation (ISO 639-1)
 * Array of 2-letter language codes
 */
const languageCodesSchema = z
  .array(z.enum(SUPPORTED_LANGUAGE_CODES))
  .min(1, 'Au moins une langue est requise')
  .refine((langs) => new Set(langs).size === langs.length, {
    message: 'Codes de langue en doublon détectés',
  });

/**
 * Schema for creating a new market
 */
export const createMarketSchema = z.object({
  name: z
    .string()
    .min(2, 'Nom du marché doit faire au moins 2 caractères')
    .max(100, 'Nom du marché trop long (max 100 caractères)')
    .trim(),
  code: marketCodeSchema,
  currency_code: currencyCodeSchema,
  timezone: timezoneSchema,
  supported_languages: languageCodesSchema,
  is_active: z.boolean().optional().default(true),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;

/**
 * Schema for updating an existing market
 * All fields optional (partial update)
 */
export const updateMarketSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nom du marché doit faire au moins 2 caractères')
      .max(100, 'Nom du marché trop long (max 100 caractères)')
      .trim()
      .optional(),
    code: marketCodeSchema.optional(),
    currency_code: currencyCodeSchema.optional(),
    timezone: timezoneSchema.optional(),
    supported_languages: languageCodesSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour',
  });

export type UpdateMarketInput = z.infer<typeof updateMarketSchema>;

/**
 * Schema for market list query parameters
 */
export const listMarketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  is_active: z.coerce.boolean().optional(),
  search: z.string().nullable().optional(),
  sort: z.enum(['id', 'name', 'code', 'created_at']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type ListMarketsQuery = z.infer<typeof listMarketsQuerySchema>;

/**
 * Schema for market ID parameter (path param)
 */
export const marketIdSchema = z.coerce.number().int().positive({
  message: 'ID marché invalide',
});

/**
 * Schema for validating market exists and is active
 * (used in business logic, not API validation)
 */
export const activeMarketSchema = z.object({
  id: z.number().int().positive(),
  is_active: z.literal(true, {
    errorMap: () => ({ message: 'Ce marché n\'est pas actif' }),
  }),
});

/**
 * Helper function to validate and parse market creation data
 */
export function validateCreateMarket(data: unknown) {
  return createMarketSchema.parse(data);
}

/**
 * Helper function to validate and parse market update data
 */
export function validateUpdateMarket(data: unknown) {
  return updateMarketSchema.parse(data);
}

/**
 * Helper function to validate and parse list query parameters
 */
export function validateListMarketsQuery(data: unknown) {
  return listMarketsQuerySchema.parse(data);
}

/**
 * Helper function to validate market ID
 */
export function validateMarketId(id: unknown) {
  return marketIdSchema.parse(id);
}

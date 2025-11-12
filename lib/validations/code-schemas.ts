/**
 * Zod validation schemas for unique code management
 * Feature: 018-international-market-segmentation
 */

import { z } from 'zod';

/**
 * Client code validation (CLI-XXXXXX format)
 */
export const clientCodeSchema = z
  .string()
  .regex(/^CLI-\d{6}$/, 'Code client invalide (format: CLI-XXXXXX)');

/**
 * Contractor code validation (CTR-XXXXXX format)
 */
export const contractorCodeSchema = z
  .string()
  .regex(/^CTR-\d{6}$/, 'Code prestataire invalide (format: CTR-XXXXXX)');

/**
 * Schema for searching clients
 */
export const searchClientsQuerySchema = z.object({
  search: z.string().nullable().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['client_code', 'first_name', 'last_name', 'created_at'])
    .default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchClientsQuery = z.infer<typeof searchClientsQuerySchema>;

/**
 * Schema for searching contractors
 */
export const searchContractorsQuerySchema = z.object({
  search: z.string().nullable().optional(),
  market_id: z.coerce.number().int().positive().nullable().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['contractor_code', 'business_name', 'created_at'])
    .default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchContractorsQuery = z.infer<
  typeof searchContractorsQuerySchema
>;

/**
 * Helper function to validate client code
 */
export function validateClientCode(code: unknown) {
  return clientCodeSchema.parse(code);
}

/**
 * Helper function to validate contractor code
 */
export function validateContractorCode(code: unknown) {
  return contractorCodeSchema.parse(code);
}

/**
 * Helper function to validate client search query
 */
export function validateSearchClientsQuery(data: unknown) {
  return searchClientsQuerySchema.parse(data);
}

/**
 * Helper function to validate contractor search query
 */
export function validateSearchContractorsQuery(data: unknown) {
  return searchContractorsQuerySchema.parse(data);
}

/**
 * Zod Validation Schemas for Service Management
 * Feature: 018-service-management-crud
 *
 * Comprehensive validation for all 33 service table columns
 * Used by admin interface for Create, Edit, and Update operations
 */

import { z } from 'zod'

// =============================================================================
// Base Enums and Primitives
// =============================================================================

export const serviceCategorySchema = z.enum([
  'massage',
  'beauty',
  'hair',
  'health',
  'wellness',
  'other'
])

export const serviceTypeSchema = z.enum([
  'at_home',
  'at_location',
  'hybrid'
])

// =============================================================================
// Core Service Fields (Original 12 columns)
// =============================================================================

const coreServiceFields = {
  // Identity
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-']+$/, 'Le nom contient des caractères invalides'),

  slug: z.preprocess(
    (val) => (val === '' ? undefined : val), // Convert empty string to undefined
    z.string()
      .min(3, 'Le slug doit contenir au moins 3 caractères')
      .max(200, 'Le slug ne peut pas dépasser 200 caractères')
      .regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets')
      .optional()
  ), // Auto-generated from name if not provided

  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères'),

  // Categories
  category_id: z.number()
    .int('L\'ID de catégorie doit être un entier')
    .positive('Veuillez sélectionner une catégorie'),

  subcategory_id: z.number()
    .int()
    .positive()
    .optional()
    .nullable(),

  // Pricing (stored in cents)
  base_price: z.number()
    .nonnegative('Le prix ne peut pas être négatif')
    .multipleOf(0.01, 'Le prix doit avoir au maximum 2 décimales')
    .refine(val => val >= 10, 'Le prix minimum est 10€'),

  // Duration (in minutes, must be multiple of 5)
  base_duration_minutes: z.number()
    .int('La durée doit être un nombre entier de minutes')
    .min(5, 'La durée minimale est 5 minutes')
    .max(480, 'La durée maximale est 8 heures (480 minutes)')
    .refine(val => val % 5 === 0, 'La durée doit être un multiple de 5 minutes'),

  // Main image (legacy column, now using service_images table)
  image_url: z.string()
    .url('L\'URL de l\'image principale doit être valide')
    .optional()
    .nullable(),

  // Status & Display
  is_active: z.boolean()
    .default(true),

  display_order: z.number()
    .int()
    .nonnegative()
    .default(0),

  service_type: serviceTypeSchema
    .default('at_home'),
}

// =============================================================================
// Extended Service Fields (21 additional columns)
// =============================================================================

const extendedServiceFields = {
  // Detailed descriptions
  intro: z.string()
    .max(500, 'L\'introduction ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),

  short_description: z.string()
    .max(500, 'La description courte ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),

  long_description: z.string()
    .max(10000, 'La description détaillée ne peut pas dépasser 10 000 caractères')
    .optional()
    .nullable(),

  // Protocol fields (8 text fields for "Protocole" tab)
  hygienic_precautions: z.string()
    .max(2000)
    .optional()
    .nullable(),

  contraindications: z.string()
    .max(2000)
    .optional()
    .nullable(),

  advises: z.string()
    .max(2000)
    .optional()
    .nullable(),

  your_session: z.string()
    .max(3000, 'Le déroulement de la séance ne peut pas dépasser 3000 caractères')
    .optional()
    .nullable(),

  preparation: z.string()
    .max(2000, 'La préparation ne peut pas dépasser 2000 caractères')
    .optional()
    .nullable(),

  suggestion: z.string()
    .max(2000, 'Les suggestions ne peuvent pas dépasser 2000 caractères')
    .optional()
    .nullable(),

  // Client targeting (Configuration tab)
  for_men: z.boolean()
    .default(false),

  for_women: z.boolean()
    .default(false),

  for_kids: z.boolean()
    .default(false),

  // Business features
  is_for_entreprise_ready: z.boolean()
    .default(false),

  // Session management (for packages/cures)
  has_many_session: z.boolean()
    .default(false),

  number_of_session: z.number()
    .int()
    .min(1)
    .default(1),

  // Service type flags
  is_additional_service: z.boolean()
    .default(false),

  // Media
  secondary_image_urls: z.array(z.string().url())
    .default([])
    .optional(),

  video_url: z.string()
    .url('L\'URL de la vidéo doit être valide')
    .optional()
    .nullable(),

  // Tags for search & filtering
  tags: z.array(z.string().min(2).max(50))
    .default([])
    .optional(),

  // Cost price (for margin calculation)
  cost_price: z.number()
    .nonnegative()
    .multipleOf(0.01)
    .optional()
    .nullable(),

  // Featured status
  is_featured: z.boolean()
    .default(false),
}

// =============================================================================
// Full Service Schema (Read - from database)
// =============================================================================

export const serviceFullSchema = z.object({
  id: z.number().int().positive(),
  ...coreServiceFields,
  ...extendedServiceFields,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// =============================================================================
// Service Insert Schema (Create)
// =============================================================================

export const serviceInsertSchema = z.object({
  ...coreServiceFields,
  ...extendedServiceFields,
})
  .refine(
    data => {
      // If has_many_session is true, number_of_session must be > 1
      if (data.has_many_session && data.number_of_session <= 1) {
        return false
      }
      return true
    },
    {
      message: 'Pour un forfait multiple séances, le nombre de séances doit être supérieur à 1',
      path: ['number_of_session'],
    }
  )
  .refine(
    data => {
      // At least one targeting flag must be true
      if (!data.for_men && !data.for_women && !data.for_kids) {
        return false
      }
      return true
    },
    {
      message: 'Le service doit être destiné à au moins une catégorie de clients (Hommes, Femmes, ou Enfants)',
      path: ['for_men'],
    }
  )
  .refine(
    data => {
      // If cost_price is provided, it must be less than base_price
      if (data.cost_price && data.cost_price >= data.base_price) {
        return false
      }
      return true
    },
    {
      message: 'Le prix de revient doit être inférieur au prix de vente',
      path: ['cost_price'],
    }
  )

// =============================================================================
// Service Update Schema (Edit - all fields optional)
// =============================================================================

export const serviceUpdateSchema = serviceInsertSchema.partial()

// =============================================================================
// Tab-Specific Schemas (for multi-tab form)
// =============================================================================

// Tab 1: Général (General info)
export const generalTabSchema = z.object({
  name: coreServiceFields.name,
  slug: coreServiceFields.slug,
  description: coreServiceFields.description,
  intro: extendedServiceFields.intro,
  short_description: extendedServiceFields.short_description,
  long_description: extendedServiceFields.long_description,
  is_active: coreServiceFields.is_active,
  is_featured: extendedServiceFields.is_featured,
  display_order: coreServiceFields.display_order,
})

// Tab 2: Prix & Durée (Pricing & Duration)
export const pricingTabSchema = z.object({
  base_price: coreServiceFields.base_price,
  cost_price: extendedServiceFields.cost_price,
  base_duration_minutes: coreServiceFields.base_duration_minutes,
  has_many_session: extendedServiceFields.has_many_session,
  number_of_session: extendedServiceFields.number_of_session,
})
  .refine(
    data => {
      if (data.has_many_session && data.number_of_session <= 1) {
        return false
      }
      return true
    },
    {
      message: 'Pour un forfait, le nombre de séances doit être > 1',
      path: ['number_of_session'],
    }
  )
  .refine(
    data => {
      if (data.cost_price && data.cost_price >= data.base_price) {
        return false
      }
      return true
    },
    {
      message: 'Le prix de revient doit être < prix de vente',
      path: ['cost_price'],
    }
  )

// Tab 3: Images - handled by ImageGalleryManager (Feature 017)

// Tab 4: Catégories
export const categoriesTabSchema = z.object({
  category_id: coreServiceFields.category_id,
  subcategory_id: coreServiceFields.subcategory_id,
  tags: extendedServiceFields.tags,
})

// Tab 5: Suppléments - handled separately via M2M relation

// Tab 6: Prestataires - handled separately via contractor_services table

// Tab 7: Configuration
export const configurationTabSchema = z.object({
  service_type: coreServiceFields.service_type,
  for_men: extendedServiceFields.for_men,
  for_women: extendedServiceFields.for_women,
  for_kids: extendedServiceFields.for_kids,
  is_for_entreprise_ready: extendedServiceFields.is_for_entreprise_ready,
  is_additional_service: extendedServiceFields.is_additional_service,
  video_url: extendedServiceFields.video_url,
})
  .refine(
    data => {
      // At least one targeting flag must be true
      if (!data.for_men && !data.for_women && !data.for_kids) {
        return false
      }
      return true
    },
    {
      message: 'Au moins une cible doit être sélectionnée',
      path: ['for_men'],
    }
  )

// Tab 8: Protocole
export const protocolTabSchema = z.object({
  preparation: extendedServiceFields.preparation,
  your_session: extendedServiceFields.your_session,
  advises: extendedServiceFields.advises,
  suggestion: extendedServiceFields.suggestion,
  hygienic_precautions: extendedServiceFields.hygienic_precautions,
  contraindications: extendedServiceFields.contraindications,
})

// =============================================================================
// Service Query & Filter Schemas
// =============================================================================

export const serviceQuerySchema = z.object({
  // Filters
  category_id: z.number().int().positive().optional(),
  subcategory_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  for_men: z.boolean().optional(),
  for_women: z.boolean().optional(),
  for_kids: z.boolean().optional(),
  is_additional_service: z.boolean().optional(),
  has_many_session: z.boolean().optional(),

  // Search
  search: z.string().min(2).max(200).optional(),

  // Pagination
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),

  // Sorting
  sort_by: z.enum(['name', 'base_price', 'display_order', 'created_at', 'updated_at']).default('display_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

// =============================================================================
// Bulk Operations Schemas
// =============================================================================

export const serviceBulkUpdateSchema = z.object({
  service_ids: z.array(z.number().int().positive()).min(1, 'Au moins un service doit être sélectionné'),
  updates: z.object({
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    category_id: z.number().int().positive().optional(),
    display_order: z.number().int().nonnegative().optional(),
  }).refine(
    data => Object.keys(data).length > 0,
    'Au moins un champ doit être mis à jour'
  ),
})

export const serviceDuplicationSchema = z.object({
  source_service_id: z.number().int().positive(),
  new_name: z.string().min(3).max(200),
  copy_images: z.boolean().default(true),
  copy_supplements: z.boolean().default(true),
  copy_contractors: z.boolean().default(false),
})

// =============================================================================
// Type Exports (for TypeScript usage)
// =============================================================================

export type ServiceFullData = z.infer<typeof serviceFullSchema>
export type ServiceInsertData = z.infer<typeof serviceInsertSchema>
export type ServiceUpdateData = z.infer<typeof serviceUpdateSchema>

export type GeneralTabData = z.infer<typeof generalTabSchema>
export type PricingTabData = z.infer<typeof pricingTabSchema>
export type CategoriesTabData = z.infer<typeof categoriesTabSchema>
export type ConfigurationTabData = z.infer<typeof configurationTabSchema>
export type ProtocolTabData = z.infer<typeof protocolTabSchema>

export type ServiceQueryParams = z.infer<typeof serviceQuerySchema>
export type ServiceBulkUpdateData = z.infer<typeof serviceBulkUpdateSchema>
export type ServiceDuplicationData = z.infer<typeof serviceDuplicationSchema>

// Zod Validation Schemas for Booking Flow
import { z } from 'zod'

// Service Category Schema
export const serviceCategorySchema = z.enum(['massage', 'beauty', 'hair', 'health', 'wellness', 'other'])

// Service Type Schema
export const serviceTypeSchema = z.enum(['at_home', 'at_location', 'hybrid'])

// Address Type Schema
export const addressTypeSchema = z.enum(['home', 'work', 'other'])

// Booking Step Schema
export const bookingStepSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])

// Booking Source Schema
export const bookingSourceSchema = z.enum(['catalog', 'contractor_slug', 'ready_to_go'])

// Service Schema
export const serviceSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  short_description: z.string().max(500).optional(),
  category: serviceCategorySchema,
  service_type: serviceTypeSchema,
  base_price: z.number().nonnegative(),
  base_duration_minutes: z.number().int().positive(),
  buffer_time_minutes: z.number().int().nonnegative(),
  image_url: z.string().url().optional(),
  gallery_image_urls: z.array(z.string().url()).optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  display_order: z.number().int().nonnegative(),
  is_enterprise_ready: z.boolean(),
  requires_ready_to_go: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Service Insert Schema (pour création)
export const serviceInsertSchema = serviceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

// Client Address Schema
export const clientAddressSchema = z.object({
  id: z.number().int().positive(),
  client_id: z.string().uuid(),
  type: addressTypeSchema,
  label: z.string().max(100).optional(),
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  postal_code: z.string().min(1).max(10),
  country: z.string().length(2).default('FR'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  building_info: z.string().optional(),
  delivery_instructions: z.string().optional(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Client Address Insert Schema
export const clientAddressInsertSchema = clientAddressSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

// Client Address Form Schema (pour formulaire côté client)
export const clientAddressFormSchema = z.object({
  type: addressTypeSchema.default('home'),
  label: z.string().max(100).optional(),
  street: z.string().min(1, 'L\'adresse est requise').max(255),
  city: z.string().min(1, 'La ville est requise').max(100),
  postal_code: z.string()
    .min(1, 'Le code postal est requis')
    .regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)'),
  country: z.string().length(2).default('FR'),
  building_info: z.string().max(500).optional(),
  delivery_instructions: z.string().max(500).optional(),
  is_default: z.boolean().default(false),
  save_address: z.boolean().default(false), // Pour demander si on sauvegarde l'adresse
})

// Timeslot Schema (JSONB dans booking_sessions)
export const timeslotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:mm)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:mm)'),
  contractor_id: z.string().uuid().optional(),
})

// Pricing Breakdown Schema (JSONB dans booking_sessions)
export const pricingBreakdownSchema = z.object({
  base_price: z.number().nonnegative(),
  service_amount: z.number().nonnegative(),
  promo_discount: z.number().nonnegative(),
  gift_card_amount: z.number().nonnegative(),
  final_amount: z.number().nonnegative(),
})

// Booking Session Schema
export const bookingSessionSchema = z.object({
  id: z.number().int().positive(),
  session_id: z.string().uuid(),
  client_id: z.string().uuid(),
  service_id: z.number().int().positive().optional(),
  address_id: z.number().int().positive().optional(),
  contractor_id: z.string().uuid().optional(),
  timeslot: timeslotSchema.optional(),
  additional_services: z.array(z.number().int().positive()).optional(),
  pricing_breakdown: pricingBreakdownSchema.optional(),
  promo_code_id: z.number().int().positive().optional(),
  promo_code: z.string().max(50).optional(),
  promo_discount_amount: z.number().nonnegative(),
  gift_card_id: z.number().int().positive().optional(),
  gift_card_code: z.string().max(50).optional(),
  gift_card_amount: z.number().nonnegative(),
  current_step: bookingStepSchema,
  source: bookingSourceSchema,
  contractor_slug: z.string().max(255).optional(),
  contractor_locked: z.boolean(),
  expires_at: z.string().datetime(),
  last_activity_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Booking Session Insert Schema
export const bookingSessionInsertSchema = bookingSessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_activity_at: true,
})

// Booking Session Update Schema (tous les champs optionnels sauf session_id)
export const bookingSessionUpdateSchema = bookingSessionSchema
  .omit({
    id: true,
    session_id: true,
    client_id: true,
    created_at: true,
  })
  .partial()

// Service Query Params Schema
export const serviceQuerySchema = z.object({
  category: serviceCategorySchema.optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(),
  market_id: z.number().int().positive().optional(), // Filter by market availability
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
})

// Types inferred from schemas
export type ServiceFormData = z.infer<typeof serviceInsertSchema>
export type ClientAddressFormData = z.infer<typeof clientAddressFormSchema>
export type BookingSessionData = z.infer<typeof bookingSessionSchema>
export type BookingSessionInsertData = z.infer<typeof bookingSessionInsertSchema>
export type BookingSessionUpdateData = z.infer<typeof bookingSessionUpdateSchema>
export type ServiceQueryParams = z.infer<typeof serviceQuerySchema>

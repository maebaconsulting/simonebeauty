/**
 * Image Management Validation Schemas
 * Feature: 017-image-management
 *
 * Zod schemas for validating image uploads, operations, and moderation
 */

import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB (configurable via platform_config)
export const MAX_ALT_TEXT_LENGTH = 125 // WCAG recommendation
export const MAX_IMAGES_PER_ENTITY = 10 // Configurable via platform_config

// ============================================================================
// Enums
// ============================================================================

export const EntityTypeSchema = z.enum(['service', 'product', 'product_variant', 'conversation'])
export type EntityType = z.infer<typeof EntityTypeSchema>

export const ModerationStatusSchema = z.enum(['pending', 'approved', 'rejected', 'under_review'])
export type ModerationStatus = z.infer<typeof ModerationStatusSchema>

export const VariantTypeSchema = z.enum(['color', 'size', 'material', 'style', 'other'])
export type VariantType = z.infer<typeof VariantTypeSchema>

// ============================================================================
// Upload Schemas
// ============================================================================

/**
 * Schema for validating image upload requests
 * Used in: /api/images/upload
 */
export const ImageUploadSchema = z.object({
  file: z.custom<File>((file) => file instanceof File, {
    message: 'Fichier invalide'
  }).refine(
    (file) => SUPPORTED_IMAGE_FORMATS.includes(file.type as any),
    {
      message: `Format non supporté. Formats acceptés: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
    }
  ).refine(
    (file) => file.size <= MAX_FILE_SIZE_BYTES,
    {
      message: `Fichier trop volumineux. Taille max: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    }
  ),
  entityType: EntityTypeSchema,
  entityId: z.number().int().positive({
    message: 'ID d\'entité invalide'
  }),
  altText: z.string()
    .max(MAX_ALT_TEXT_LENGTH, {
      message: `Alt-text trop long (max ${MAX_ALT_TEXT_LENGTH} caractères)`
    })
    .optional(),
  isPrimary: z.boolean().default(false)
})

export type ImageUploadInput = z.infer<typeof ImageUploadSchema>

/**
 * Schema for validating FormData from multipart/form-data upload
 */
export const ImageUploadFormDataSchema = z.object({
  entityType: EntityTypeSchema,
  entityId: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  altText: z.string().max(MAX_ALT_TEXT_LENGTH).nullable().transform((val) => val || undefined).optional(),
  isPrimary: z.string().default('false').transform((val) => val === 'true')
})

// ============================================================================
// Operation Schemas
// ============================================================================

/**
 * Schema for reordering images
 * Used in: /api/images/reorder
 */
export const ImageReorderSchema = z.object({
  entityType: EntityTypeSchema,
  entityId: z.number().int().positive(),
  imageOrder: z.array(z.number().int().positive()).min(1, {
    message: 'Au moins une image requise'
  }).max(MAX_IMAGES_PER_ENTITY, {
    message: `Maximum ${MAX_IMAGES_PER_ENTITY} images`
  })
})

export type ImageReorderInput = z.infer<typeof ImageReorderSchema>

/**
 * Schema for deleting an image (soft delete)
 * Used in: /api/images/delete
 */
export const ImageDeleteSchema = z.object({
  imageId: z.number().int().positive(),
  entityType: EntityTypeSchema
})

export type ImageDeleteInput = z.infer<typeof ImageDeleteSchema>

/**
 * Schema for generating AI alt-text
 * Used in: /api/images/generate-alt-text
 */
export const GenerateAltTextSchema = z.object({
  imageId: z.number().int().positive(),
  entityType: EntityTypeSchema,
  saveToDatabase: z.boolean().default(true)
})

export type GenerateAltTextInput = z.infer<typeof GenerateAltTextSchema>

// ============================================================================
// Moderation Schemas
// ============================================================================

/**
 * Schema for moderating UGC images
 * Used in: /api/images/moderate
 */
export const ModerateImageSchema = z.object({
  attachmentId: z.number().int().positive(),
  status: ModerationStatusSchema,
  reason: z.string().max(500).optional()
}).refine(
  (data) => {
    // Reason is required when status is 'rejected'
    if (data.status === 'rejected' && !data.reason) {
      return false
    }
    return true
  },
  {
    message: 'Raison requise pour les rejets',
    path: ['reason']
  }
)

export type ModerateImageInput = z.infer<typeof ModerateImageSchema>

/**
 * Schema for querying moderation queue
 * Used in: /api/images/moderation-queue
 */
export const ModerationQueueQuerySchema = z.object({
  status: ModerationStatusSchema.default('pending'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
})

export type ModerationQueueQuery = z.infer<typeof ModerationQueueQuerySchema>

// ============================================================================
// Product Variant Schemas
// ============================================================================

/**
 * Schema for creating product variants
 * Used in: Admin product management
 */
export const ProductVariantSchema = z.object({
  productId: z.number().int().positive(),
  variantName: z.string().min(1, {
    message: 'Nom de variation requis'
  }).max(100),
  variantType: VariantTypeSchema,
  sku: z.string().max(100).optional()
})

export type ProductVariantInput = z.infer<typeof ProductVariantSchema>

// ============================================================================
// Response Schemas (for type safety)
// ============================================================================

export const ImageUploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.number(),
    storagePath: z.string(),
    publicUrl: z.string().url(),
    altText: z.string(),
    fileSizeBytes: z.number(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    displayOrder: z.number(),
    isPrimary: z.boolean()
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional()
  }).optional()
})

export type ImageUploadResponse = z.infer<typeof ImageUploadResponseSchema>

export const AltTextGenerationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    imageId: z.number(),
    altText: z.string(),
    generatedBy: z.string(),
    saved: z.boolean()
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.object({
      fallback: z.string().optional()
    }).optional()
  }).optional()
})

export type AltTextGenerationResponse = z.infer<typeof AltTextGenerationResponseSchema>

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate file is an image with proper format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: `Format non supporté. Formats acceptés: JPEG, PNG, WebP`
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille max: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    }
  }

  return { valid: true }
}

/**
 * Extract image dimensions from File object
 * Returns Promise<{width: number, height: number}> or null if extraction fails
 */
export function extractImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        width: img.width,
        height: img.height
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }

    img.src = objectUrl
  })
}

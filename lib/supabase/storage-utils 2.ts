/**
 * Supabase Storage Utilities
 * Features: 007-contractor-interface, 017-image-management
 *
 * Helper functions for file uploads to Supabase Storage
 */

import { createClient } from './client'
import type { EntityType } from '@/lib/validations/image-schemas'

export interface UploadResult {
  path: string
  url: string
}

/**
 * Upload a file to Supabase Storage
 *
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param folder - Folder path within bucket
 * @param filename - Optional custom filename (defaults to original with timestamp)
 * @returns Upload result with path and public URL
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string,
  filename?: string
): Promise<UploadResult> {
  const supabase = createClient()

  // Generate unique filename
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const finalFilename = filename || `${timestamp}_${sanitizedName}`
  const filePath = `${folder}/${finalFilename}`

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Échec de l'upload: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: publicUrl,
  }
}

/**
 * Upload multiple files to Supabase Storage
 *
 * @param files - Array of files to upload
 * @param bucket - Storage bucket name
 * @param folder - Folder path within bucket
 * @returns Array of upload results
 */
export async function uploadFiles(
  files: File[],
  bucket: string,
  folder: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadFile(file, bucket, folder))
  return Promise.all(uploadPromises)
}

/**
 * Delete a file from Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Échec de la suppression: ${error.message}`)
  }
}

/**
 * Delete multiple files from Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths within bucket
 */
export async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Échec de la suppression: ${error.message}`)
  }
}

/**
 * Validate file size and type
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  maxSizeMB: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  // Check size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Le fichier ${file.name} est trop volumineux (max ${maxSizeMB}MB)`,
    }
  }

  // Check type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Le type de fichier ${file.type} n'est pas autorisé`,
    }
  }

  return { valid: true }
}

/**
 * Constants for file validation
 */
export const FILE_CONSTRAINTS = {
  DOCUMENTS: {
    maxSizeMB: 5,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  IMAGES: {
    maxSizeMB: 5,
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ],
  },
} as const

// ============================================================================
// Image Management Utilities (Feature 017)
// ============================================================================

/**
 * Get bucket name for entity type
 */
export function getBucketForEntityType(entityType: EntityType): string {
  const bucketMap: Record<EntityType, string> = {
    service: 'service-images',
    product: 'product-images',
    product_variant: 'product-images',
    conversation: 'conversation-attachments',
  }
  return bucketMap[entityType]
}

/**
 * Generate structured filename for image upload
 * Format: {entityType}_{entityId}_{timestamp}.{ext}
 */
export function generateImageFilename(
  entityType: EntityType,
  entityId: number,
  file: File
): string {
  const timestamp = Date.now()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  return `${entityType}_${entityId}_${timestamp}.${ext}`
}

/**
 * Generate folder path for image upload
 * Format: {entityType}s/{entityId}/
 */
export function generateImageFolderPath(
  entityType: EntityType,
  entityId: number
): string {
  // Pluralize entity type (simple implementation)
  const plural = entityType === 'conversation' ? 'conversations' : `${entityType}s`
  return `${plural}/${entityId}`
}

/**
 * Upload image to appropriate bucket with standardized naming
 * @param supabaseClient - Optional Supabase client (for server-side with auth context)
 */
export async function uploadImageFile(
  file: File,
  entityType: EntityType,
  entityId: number,
  supabaseClient?: any
): Promise<UploadResult> {
  const bucket = getBucketForEntityType(entityType)
  const folder = generateImageFolderPath(entityType, entityId)
  const filename = generateImageFilename(entityType, entityId, file)

  // Use provided client or create new one
  const supabase = supabaseClient || createClient()

  // Generate unique filename with path
  const filePath = `${folder}/${filename}`

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Échec de l'upload: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: publicUrl,
  }
}

/**
 * Get optimized image URL with Supabase transformations
 * Supabase supports URL-based image transformations
 *
 * @param publicUrl - Original public URL from Supabase Storage
 * @param options - Transformation options
 * @returns Transformed URL
 */
export function getOptimizedImageUrl(
  publicUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'origin'
  } = {}
): string {
  // Supabase Storage doesn't support transformations natively in free tier
  // Return original URL for now
  // When upgrading to Pro, use Supabase Image Transformation API:
  // https://supabase.com/docs/guides/storage/serving/image-transformations

  // For MVP, client-side optimization via Next.js Image component is sufficient
  return publicUrl
}

/**
 * Extract image dimensions from File object (browser only)
 * @param file - Image file
 * @returns Promise resolving to {width, height} or null on error
 */
export function extractImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve(null)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }

    img.src = objectUrl
  })
}

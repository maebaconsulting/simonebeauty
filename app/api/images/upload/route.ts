/**
 * POST /api/images/upload
 * Feature: 017-image-management
 *
 * Upload image to appropriate storage bucket and create database record
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ImageUploadFormDataSchema, MAX_FILE_SIZE_BYTES, SUPPORTED_IMAGE_FORMATS } from '@/lib/validations/image-schemas'
import { uploadImageFile, extractImageDimensions } from '@/lib/supabase/storage-utils'
import type { EntityType } from '@/lib/validations/image-schemas'
import type { DbServiceImageInsert, DbProductImageInsert, DbConversationAttachmentInsert } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Server Component - ignored
            }
          },
          remove(name: string, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Server Component - ignored
            }
          },
        },
      }
    )

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication requise'
          }
        },
        { status: 401 }
      )
    }

    // Check user role (admin/manager only for service/product images)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Fichier requis'
          }
        },
        { status: 400 }
      )
    }

    // Validate form data
    const parseResult = ImageUploadFormDataSchema.safeParse({
      entityType: formData.get('entityType'),
      entityId: formData.get('entityId'),
      altText: formData.get('altText'),
      isPrimary: formData.get('isPrimary')
    })

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Paramètres invalides',
            details: parseResult.error.flatten()
          }
        },
        { status: 400 }
      )
    }

    const { entityType, entityId, altText, isPrimary } = parseResult.data

    // Check permissions
    if (['service', 'product', 'product_variant'].includes(entityType)) {
      if (!profile || !['admin', 'manager'].includes(profile.role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Permissions insuffisantes'
            }
          },
          { status: 403 }
        )
      }
    }

    // Validate file
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as any)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: `Format non supporté (JPEG, PNG, WebP uniquement)`
          }
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Fichier trop volumineux (max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)`
          }
        },
        { status: 400 }
      )
    }

    // Upload to storage (pass supabase client with auth context)
    const uploadResult = await uploadImageFile(file, entityType as EntityType, entityId, supabase)

    // Extract image dimensions (optional, may fail)
    let dimensions: { width: number; height: number } | null = null
    try {
      // Note: This won't work server-side, would need sharp or similar
      // For now, dimensions will be null and can be updated client-side
      dimensions = null
    } catch (error) {
      console.warn('Failed to extract dimensions:', error)
    }

    // Get next display order
    const tableName = getTableNameForEntityType(entityType as EntityType)
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq(getEntityIdColumnName(entityType as EntityType), entityId)
      .is('deleted_at', null)

    const displayOrder = count || 0

    // Create database record
    let imageRecord: any
    if (entityType === 'service') {
      const insertData: DbServiceImageInsert = {
        service_id: entityId,
        storage_path: uploadResult.path,
        display_order: displayOrder,
        is_primary: isPrimary,
        alt_text: altText || `Service image - Simone Paris`,
        uploaded_by: session.user.id,
        file_size_bytes: file.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null
      }

      const { data, error } = await supabase
        .from('service_images')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      imageRecord = data
    } else if (entityType === 'product' || entityType === 'product_variant') {
      const variantId = entityType === 'product_variant' ? entityId : null
      const productId = entityType === 'product' ? entityId : null

      const insertData: DbProductImageInsert = {
        product_id: productId || entityId, // TODO: Fix when variant handling is implemented
        variant_id: variantId,
        storage_path: uploadResult.path,
        display_order: displayOrder,
        is_primary: isPrimary,
        alt_text: altText || `Product image - Simone Paris`,
        uploaded_by: session.user.id,
        file_size_bytes: file.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null
      }

      const { data, error } = await supabase
        .from('product_images')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      imageRecord = data
    } else if (entityType === 'conversation') {
      const insertData: DbConversationAttachmentInsert = {
        conversation_id: entityId,
        uploaded_by_user_id: session.user.id,
        storage_path: uploadResult.path,
        alt_text: altText || null,
        moderation_status: 'pending',
        file_size_bytes: file.size
      }

      const { data, error } = await supabase
        .from('conversation_attachments')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      imageRecord = data
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: imageRecord.id,
          storagePath: uploadResult.path,
          publicUrl: uploadResult.url,
          altText: imageRecord.alt_text || altText,
          fileSizeBytes: file.size,
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
          displayOrder: displayOrder,
          isPrimary: isPrimary
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Image upload error:', error)

    // Handle database trigger errors (max images limit)
    if (error.message?.includes('Maximum number of images')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MAX_IMAGES_REACHED',
            message: error.message
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: "Erreur lors de l'upload de l'image"
        }
      },
      { status: 500 }
    )
  }
}

// Helper functions
function getTableNameForEntityType(entityType: EntityType): string {
  const tableMap: Record<EntityType, string> = {
    service: 'service_images',
    product: 'product_images',
    product_variant: 'product_images',
    conversation: 'conversation_attachments'
  }
  return tableMap[entityType]
}

function getEntityIdColumnName(entityType: EntityType): string {
  const columnMap: Record<EntityType, string> = {
    service: 'service_id',
    product: 'product_id',
    product_variant: 'variant_id',
    conversation: 'conversation_id'
  }
  return columnMap[entityType]
}

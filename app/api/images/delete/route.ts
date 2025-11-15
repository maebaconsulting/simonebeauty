/**
 * DELETE /api/images/delete
 * Feature: 017-image-management
 *
 * Soft delete an image by setting deleted_at timestamp
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ImageDeleteSchema } from '@/lib/validations/image-schemas'
import type { EntityType } from '@/lib/validations/image-schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
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

    // Check user role (admin/manager only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const imageId = searchParams.get('imageId')
    const entityType = searchParams.get('entityType')

    if (!imageId || !entityType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'imageId et entityType requis'
          }
        },
        { status: 400 }
      )
    }

    // Validate parameters
    const parseResult = ImageDeleteSchema.safeParse({
      imageId: parseInt(imageId, 10),
      entityType
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

    const { imageId: validImageId, entityType: validEntityType } = parseResult.data

    // Get table name
    const tableName = getTableNameForEntityType(validEntityType as EntityType)

    // Check if image exists
    const { data: existingImage, error: fetchError } = await supabase
      .from(tableName)
      .select('id, deleted_at')
      .eq('id', validImageId)
      .single()

    if (fetchError || !existingImage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Image introuvable'
          }
        },
        { status: 404 }
      )
    }

    if (existingImage.deleted_at) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_DELETED',
            message: 'Image déjà supprimée'
          }
        },
        { status: 400 }
      )
    }

    // Soft delete by setting deleted_at timestamp
    const now = new Date().toISOString()
    const { error: deleteError } = await supabase
      .from(tableName)
      .update({ deleted_at: now })
      .eq('id', validImageId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          imageId: validImageId,
          deletedAt: now
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Image delete error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la suppression de l\'image'
        }
      },
      { status: 500 }
    )
  }
}

// Helper function
function getTableNameForEntityType(entityType: EntityType): string {
  const tableMap: Record<EntityType, string> = {
    service: 'service_images',
    product: 'product_images',
    product_variant: 'product_images',
    conversation: 'conversation_attachments'
  }
  return tableMap[entityType]
}

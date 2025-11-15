/**
 * POST /api/images/reorder
 * Feature: 017-image-management
 *
 * Reorder images for an entity (drag-and-drop in admin UI)
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ImageReorderSchema } from '@/lib/validations/image-schemas'
import type { EntityType } from '@/lib/validations/image-schemas'

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

    // Parse and validate request body
    const body = await request.json()
    const parseResult = ImageReorderSchema.safeParse(body)

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

    const { entityType, entityId, imageOrder } = parseResult.data

    // Get table name
    const tableName = getTableNameForEntityType(entityType as EntityType)
    const entityIdColumn = getEntityIdColumnName(entityType as EntityType)

    // Update display_order for each image
    let updatedCount = 0
    for (let i = 0; i < imageOrder.length; i++) {
      const imageId = imageOrder[i]
      const newDisplayOrder = i

      const { error } = await supabase
        .from(tableName)
        .update({ display_order: newDisplayOrder })
        .eq('id', imageId)
        .eq(entityIdColumn, entityId)
        .is('deleted_at', null)

      if (error) {
        console.error(`Failed to update image ${imageId}:`, error)
      } else {
        updatedCount++
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          updated: updatedCount
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Image reorder error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors du réordonnancement des images'
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

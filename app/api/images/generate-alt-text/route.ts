/**
 * POST /api/images/generate-alt-text
 * Feature: 017-image-management
 *
 * Generate AI-powered alt-text for an image using OpenAI GPT-4 Vision
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { GenerateAltTextSchema } from '@/lib/validations/image-schemas'
import { generateAltText } from '@/lib/ai/generate-alt-text'
import { isOpenAIConfigured } from '@/lib/ai/openai-client'
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

    // Check user role (admin/manager for service/product images, or owner for conversation images)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Parse and validate request body
    const body = await request.json()
    const parseResult = GenerateAltTextSchema.safeParse(body)

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

    const { imageId, entityType, saveToDatabase } = parseResult.data

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

    // Get image record from database
    const tableName = getTableNameForEntityType(entityType as EntityType)
    const { data: imageRecord, error: fetchError } = await supabase
      .from(tableName)
      .select('*, services(name), products(name)')
      .eq('id', imageId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !imageRecord) {
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

    // For conversation attachments, verify ownership
    if (entityType === 'conversation') {
      if (imageRecord.uploaded_by_user_id !== session.user.id &&
          (!profile || !['admin', 'manager'].includes(profile.role))) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Vous ne pouvez générer d\'alt-text que pour vos propres images'
            }
          },
          { status: 403 }
        )
      }
    }

    // Get public URL for the image
    const bucket = getBucketForEntityType(entityType as EntityType)
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(imageRecord.storage_path)

    // Get entity name for context
    let entityName: string | undefined
    if (entityType === 'service' && imageRecord.services) {
      entityName = imageRecord.services.name
    } else if ((entityType === 'product' || entityType === 'product_variant') && imageRecord.products) {
      entityName = imageRecord.products.name
    }

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OPENAI_NOT_CONFIGURED',
            message: 'OpenAI non configuré. Veuillez configurer OPENAI_API_KEY.',
            details: {
              fallback: entityName ? `${entityName} - Simone Paris` : 'Image - Simone Paris'
            }
          }
        },
        { status: 500 }
      )
    }

    // Generate alt-text using OpenAI
    const result = await generateAltText({
      imageUrl: publicUrl,
      entityType: entityType as EntityType,
      entityName,
      maxLength: 125
    })

    // Save to database if requested
    if (saveToDatabase && !result.isFallback) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ alt_text: result.altText })
        .eq('id', imageId)

      if (updateError) {
        console.error('Failed to save alt-text to database:', updateError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          imageId,
          altText: result.altText,
          generatedBy: result.model,
          saved: saveToDatabase && !result.isFallback
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Alt-text generation error:', error)

    // Handle specific OpenAI errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OPENAI_API_ERROR',
            message: 'Erreur avec la clé API OpenAI',
            details: {
              fallback: 'Image - Simone Paris'
            }
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'Erreur lors de la génération de l\'alt-text',
          details: {
            fallback: 'Image - Simone Paris'
          }
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

function getBucketForEntityType(entityType: EntityType): string {
  const bucketMap: Record<EntityType, string> = {
    service: 'service-images',
    product: 'product-images',
    product_variant: 'product-images',
    conversation: 'conversation-attachments'
  }
  return bucketMap[entityType]
}

/**
 * DELETE /api/admin/categories/[id]/image
 * Feature: Category Images (extension of 017-image-management)
 *
 * Delete category image from storage and clear image_url field
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id, 10)

    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID de catégorie invalide'
          }
        },
        { status: 400 }
      )
    }

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

    // Get category with current image URL
    const { data: category, error: categoryError } = await supabase
      .from('service_categories')
      .select('id, name, image_url')
      .eq('id', categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Catégorie introuvable'
          }
        },
        { status: 404 }
      )
    }

    if (!category.image_url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_IMAGE',
            message: 'Aucune image à supprimer'
          }
        },
        { status: 400 }
      )
    }

    // Extract storage path from public URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/category-images/categories/filename.jpg
    const urlParts = category.image_url.split('/category-images/')
    if (urlParts.length !== 2) {
      console.error('Invalid image URL format:', category.image_url)
      // Still clear the image_url field even if we can't parse the path
      await supabase
        .from('service_categories')
        .update({ image_url: null })
        .eq('id', categoryId)

      return NextResponse.json(
        {
          success: true,
          data: {
            categoryId,
            message: 'Image URL cleared (file may still exist in storage)'
          }
        },
        { status: 200 }
      )
    }

    const storagePath = urlParts[1]

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('category-images')
      .remove([storagePath])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
      // Continue even if storage delete fails - we'll clear the URL anyway
    }

    // Clear image_url field in database
    const { error: updateError } = await supabase
      .from('service_categories')
      .update({ image_url: null })
      .eq('id', categoryId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          categoryId,
          message: 'Image supprimée avec succès'
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Category image delete error:', error)

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

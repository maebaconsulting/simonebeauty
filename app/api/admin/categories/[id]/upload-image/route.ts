/**
 * POST /api/admin/categories/[id]/upload-image
 * Feature: Category Images (extension of 017-image-management)
 *
 * Upload category image to storage and update category image_url
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { MAX_FILE_SIZE_BYTES, SUPPORTED_IMAGE_FORMATS } from '@/lib/validations/image-schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
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

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('service_categories')
      .select('id, name, slug')
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

    // Validate file type
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

    // Validate file size (2MB max for categories - smaller than services)
    const MAX_CATEGORY_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_CATEGORY_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Fichier trop volumineux (max ${MAX_CATEGORY_IMAGE_SIZE / (1024 * 1024)}MB)`
          }
        },
        { status: 400 }
      )
    }

    // Generate filename: category_{id}_{timestamp}.{ext}
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `category_${categoryId}_${timestamp}.${ext}`
    const filePath = `categories/${filename}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('category-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Échec de l'upload: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('category-images')
      .getPublicUrl(uploadData.path)

    // Update category with new image URL
    const { data: updatedCategory, error: updateError } = await supabase
      .from('service_categories')
      .update({ image_url: publicUrl })
      .eq('id', categoryId)
      .select()
      .single()

    if (updateError) {
      // Try to clean up uploaded file
      await supabase.storage
        .from('category-images')
        .remove([uploadData.path])

      throw updateError
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          categoryId: updatedCategory.id,
          categoryName: updatedCategory.name,
          imageUrl: publicUrl,
          storagePath: uploadData.path
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Category image upload error:', error)

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

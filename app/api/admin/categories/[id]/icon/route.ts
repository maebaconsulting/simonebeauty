/**
 * PATCH /api/admin/categories/[id]/icon
 * Feature: Category Images (extension of 017-image-management)
 *
 * Update category or subcategory icon (emoji)
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
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

    // Parse request body
    const body = await request.json()
    const { icon } = body

    if (!icon || typeof icon !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ICON',
            message: 'Icône invalide'
          }
        },
        { status: 400 }
      )
    }

    // Validate emoji (basic check: 1-4 characters, includes common emoji ranges)
    if (icon.length > 4) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ICON_TOO_LONG',
            message: 'Icône trop longue (max 4 caractères)'
          }
        },
        { status: 400 }
      )
    }

    // Update category icon
    const { data: updatedCategory, error: updateError } = await supabase
      .from('service_categories')
      .update({ icon })
      .eq('id', categoryId)
      .select('id, name, icon')
      .single()

    if (updateError) {
      console.error('Update category icon error:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Erreur lors de la mise à jour de l\'icône'
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedCategory
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Update icon error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la mise à jour de l\'icône'
        }
      },
      { status: 500 }
    )
  }
}

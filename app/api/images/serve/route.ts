/**
 * GET /api/images/serve
 * Feature: 017-image-management
 *
 * Serves images from Supabase Storage with proper caching headers
 * Supports public access (no authentication required for public images)
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storagePath = searchParams.get('path')

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
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

    // Determine bucket from path
    // Paths format: "services/123/image-uuid.jpg" or "products/456/image-uuid.jpg"
    let bucket: string
    if (storagePath.startsWith('services/')) {
      bucket = 'service-images'
    } else if (storagePath.startsWith('products/')) {
      bucket = 'product-images'
    } else if (storagePath.startsWith('conversations/')) {
      bucket = 'conversation-attachments'
    } else {
      return NextResponse.json(
        { error: 'Invalid storage path' },
        { status: 400 }
      )
    }

    // Get public URL from Supabase Storage
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath)

    if (!data.publicUrl) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Redirect to the public URL with caching headers
    return NextResponse.redirect(data.publicUrl, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'CDN-Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error: any) {
    console.error('Image serve error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

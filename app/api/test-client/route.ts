import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()

    // Test 1: Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({
        success: false,
        step: 'auth',
        error: authError.message,
      })
    }

    // Test 2: Try to fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .limit(3)

    if (categoriesError) {
      return NextResponse.json({
        success: false,
        step: 'categories',
        user: user?.id,
        error: categoriesError.message,
        hint: categoriesError.hint,
        details: categoriesError.details,
        code: categoriesError.code,
      })
    }

    // Test 3: Try to fetch services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .eq('is_active', true)
      .limit(3)

    if (servicesError) {
      return NextResponse.json({
        success: false,
        step: 'services',
        user: user?.id,
        error: servicesError.message,
        hint: servicesError.hint,
        details: servicesError.details,
        code: servicesError.code,
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
      },
      categoriesCount: categories?.length || 0,
      servicesCount: services?.length || 0,
      sampleCategory: categories?.[0],
      sampleService: services?.[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}

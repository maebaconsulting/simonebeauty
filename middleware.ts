import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Supported locales - must match i18n/config.ts
 */
const locales = ['fr', 'en', 'es', 'de', 'nl', 'it'] as const
type Locale = (typeof locales)[number]
const defaultLocale: Locale = 'fr'

/**
 * Detect user's preferred locale from cookie or Accept-Language header
 */
function getLocale(request: NextRequest): Locale {
  // 1. Check if user has manually selected a locale (stored in cookie)
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')[0]
      ?.split('-')[0]
      ?.toLowerCase()

    if (preferredLocale && locales.includes(preferredLocale as Locale)) {
      return preferredLocale as Locale
    }
  }

  // 3. Fallback to default locale
  return defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Detect user's preferred locale
  const locale = getLocale(request)

  // Create response with locale cookie
  let response = NextResponse.next({ request })
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define route types
  const protectedRoutes = ['/dashboard', '/profile', '/bookings', '/admin', '/contractor', '/client']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/admin')
  const isContractorRoute = pathname.startsWith('/contractor')
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isHomepage = pathname === '/'

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and accessing auth pages, admin routes, contractor routes, or homepage
  // we need to check their role - do ONE profile query
  if (user && (isAuthPage || isAdminRoute || isContractorRoute || isHomepage)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Admin route protection
    if (isAdminRoute && role !== 'admin' && role !== 'manager') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Contractor route protection
    if (isContractorRoute && role !== 'contractor') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      if (role === 'admin' || role === 'manager') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (role === 'contractor') {
        return NextResponse.redirect(new URL('/contractor/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/client', request.url))
      }
    }

    // Homepage redirect for authenticated users
    if (isHomepage) {
      if (role === 'admin' || role === 'manager') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (role === 'contractor') {
        return NextResponse.redirect(new URL('/contractor/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/client', request.url))
      }
    }

    // Contractor onboarding check (only if accessing contractor routes)
    if (isContractorRoute && role === 'contractor') {
      const { data: onboardingStatus } = await supabase
        .from('contractor_onboarding_status')
        .select('is_completed')
        .eq('contractor_id', user.id)
        .single()

      const isOnboardingPage = pathname.startsWith('/contractor/onboarding')

      if (onboardingStatus && !onboardingStatus.is_completed && !isOnboardingPage) {
        return NextResponse.redirect(new URL('/contractor/onboarding', request.url))
      }

      if (onboardingStatus && onboardingStatus.is_completed && isOnboardingPage) {
        return NextResponse.redirect(new URL('/contractor/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

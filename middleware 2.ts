import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Rate limiting storage (in-memory, suitable for development/MVP)
 * For production with multiple instances, use Redis or similar
 */
const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number; attempts: Map<string, number> }
>()

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  LOGIN_MAX_ATTEMPTS: 5, // Maximum login attempts
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  GENERAL_MAX_REQUESTS: 100, // General rate limit
  GENERAL_WINDOW: 60 * 1000, // 1 minute
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Check rate limit for a given IP and path
 */
function checkRateLimit(
  ip: string,
  path: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  cleanupRateLimits()

  const key = `${ip}:${path}`
  const now = Date.now()
  const limit = rateLimitMap.get(key)

  if (limit && now < limit.resetAt) {
    if (limit.count >= maxAttempts) {
      return false // Rate limit exceeded
    }
    limit.count++
    return true
  } else {
    // Create new rate limit entry
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
      attempts: new Map(),
    })
    return true
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  // Apply stricter rate limiting to auth endpoints
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
    const allowed = checkRateLimit(
      ip,
      pathname,
      RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS,
      RATE_LIMIT_CONFIG.LOGIN_WINDOW
    )

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.',
          type: 'rate_limit_exceeded',
        },
        { status: 429 }
      )
    }
  }

  // ============================================================================
  // AUTH SESSION REFRESH
  // ============================================================================

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if exists
  await supabase.auth.getSession()

  // ============================================================================
  // PROTECTED ROUTES
  // ============================================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/bookings']
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth pages while logged in
  const authPages = ['/login', '/signup']
  const isAuthPage = authPages.some((page) => pathname.startsWith(page))

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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

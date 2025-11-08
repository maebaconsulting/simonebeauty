import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Session configuration
 * 7 days = 604800 seconds
 */
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              maxAge: SESSION_MAX_AGE, // 7 days
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

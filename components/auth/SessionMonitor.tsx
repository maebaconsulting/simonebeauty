'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * SessionMonitor component
 * Monitors session expiration and redirects to login when session expires
 * Also displays a warning before expiration
 */
export function SessionMonitor() {
  const router = useRouter()
  const supabase = createClient()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Check session periodically (every 5 minutes)
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Session expired, redirect to login
        router.push('/login?expired=true')
        return
      }

      // Check if session expires in next 10 minutes
      const expiresAt = session.expires_at
      if (expiresAt) {
        const expiresIn = expiresAt * 1000 - Date.now()
        const tenMinutes = 10 * 60 * 1000

        if (expiresIn < tenMinutes && expiresIn > 0) {
          setShowWarning(true)
        } else {
          setShowWarning(false)
        }
      }
    }

    // Initial check
    checkSession()

    // Check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000)

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      }
      if (event === 'TOKEN_REFRESHED') {
        setShowWarning(false)
      }
    })

    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  if (!showWarning) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Session expiration warning
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            Your session will expire soon. Please save your work.
          </p>
        </div>
      </div>
    </div>
  )
}

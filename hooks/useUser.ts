// React Query Hook for User Authentication
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
}

/**
 * Get currently authenticated user with profile
 */
export function useUser() {
  const supabase = createClient()

  const query = useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Error fetching user:', userError)
        return { user: null, profile: null }
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return { user, profile: null }
      }

      return { user, profile }
    },
    staleTime: 0, // Always refetch when needed (prevents stale auth state)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  return {
    user: query.data?.user ?? null,
    profile: query.data?.profile ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Get current user session
 */
export function useSession() {
  const supabase = createClient()

  return useQuery({
    queryKey: [...userKeys.all, 'session'] as const,
    queryFn: async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Error fetching session:', error)
        return null
      }

      return session
    },
    staleTime: 0, // Always refetch when needed (prevents stale auth state)
    gcTime: 5 * 60 * 1000,
  })
}

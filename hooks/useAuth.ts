import { useAuthContext } from '@/components/auth/AuthProvider'
import { AuthSession } from '@/types/auth'

/**
 * Hook to access authentication state
 * Must be used within AuthProvider
 *
 * @returns {AuthSession} Current auth session with user, loading, and error state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, error } = useAuth()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!user) return <div>Not authenticated</div>
 *
 *   return <div>Welcome {user.email}</div>
 * }
 * ```
 */
export function useAuth(): AuthSession & { signOut: () => Promise<void> } {
  return useAuthContext()
}

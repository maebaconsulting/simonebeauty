'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SessionMonitor } from '@/components/auth/SessionMonitor'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Header with logout button */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-semibold">Simone Paris</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Se déconnecter
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Session monitor */}
      <SessionMonitor />
    </div>
  )
}

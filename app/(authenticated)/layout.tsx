'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh() // Force refresh to clear cached data
  }

  return (
    <div className="min-h-screen">
      {/* Header with booking and logout buttons */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/client">
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-semibold">Simone Paris</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/booking/services">
              <Button className="bg-gradient-to-r from-button-primary to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-md">
                <Sparkles className="w-4 h-4 mr-2" />
                Réserver un service
              </Button>
            </Link>
            <Button onClick={handleSignOut} variant="outline">
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}

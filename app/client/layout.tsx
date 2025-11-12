'use client'

/**
 * Client Layout
 * Feature: 006-client-interface
 * Provides navigation and layout structure for all client pages
 */

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import {
  LayoutDashboard,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Bell,
  LogOut,
  Loader2,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ClientLayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, isLoading } = useUser()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-button-primary animate-spin" />
      </div>
    )
  }

  // Only allow clients - render children without layout for access denied page
  if (!profile || profile.role !== 'client') {
    return <>{children}</>
  }

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/client',
      icon: LayoutDashboard,
      current: pathname === '/client'
    },
    {
      name: 'Mes réservations',
      href: '/client/bookings',
      icon: Calendar,
      current: pathname?.startsWith('/client/bookings')
    },
    {
      name: 'Mes adresses',
      href: '/client/addresses',
      icon: MapPin,
      current: pathname?.startsWith('/client/addresses')
    },
    {
      name: 'Mon profil',
      href: '/client/profile',
      icon: User,
      current: pathname?.startsWith('/client/profile')
    },
    {
      name: 'Notifications',
      href: '/client/notifications',
      icon: Bell,
      current: pathname?.startsWith('/client/notifications')
    },
    {
      name: 'Paiements',
      href: '/client/payments',
      icon: CreditCard,
      current: pathname?.startsWith('/client/payments')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/client">
              <h1 className="font-playfair text-2xl font-bold text-gray-900">
                Simone Paris
              </h1>
              <p className="text-sm text-gray-600 mt-1">Espace Client</p>
            </Link>
          </div>

          {/* Quick Action - Book Service */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/booking/services">
              <Button className="w-full bg-gradient-to-r from-button-primary to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-md">
                <Sparkles className="w-4 h-4 mr-2" />
                Réserver un service
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.current

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-button-primary/10 text-button-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs text-gray-600">{profile.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {children}
      </div>
    </div>
  )
}

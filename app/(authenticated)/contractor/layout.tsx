'use client'

/**
 * Contractor Layout with Sidebar Navigation
 * Feature: 007-contractor-interface
 *
 * Provides navigation and layout structure for all contractor pages
 */

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  User,
  LogOut,
  Loader2,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ContractorLayoutProps {
  children: ReactNode
}

export default function ContractorLayout({ children }: ContractorLayoutProps) {
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
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (!profile || profile.role !== 'contractor') {
    return null
  }

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/contractor/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/contractor/dashboard'
    },
    {
      name: 'Planning',
      href: '/contractor/planning',
      icon: Calendar,
      current: pathname === '/contractor/planning'
    },
    {
      name: 'Réservations',
      href: '/contractor/reservations',
      icon: ClipboardList,
      current: pathname === '/contractor/reservations'
    },
    {
      name: 'Profil',
      href: '/contractor/profile',
      icon: User,
      current: pathname === '/contractor/profile',
      disabled: true
    },
    {
      name: 'Notifications',
      href: '/contractor/notifications',
      icon: Bell,
      current: pathname === '/contractor/notifications',
      disabled: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/contractor/dashboard">
              <h1 className="font-playfair text-2xl font-bold text-purple-900">
                Simone Paris
              </h1>
              <p className="text-sm text-gray-600 mt-1">Espace Prestataire</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.current

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 px-4 py-3 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">Bientôt</span>
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-900 font-medium'
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
              <p className="text-xs text-purple-600 mt-1 font-medium uppercase">
                Prestataire
              </p>
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

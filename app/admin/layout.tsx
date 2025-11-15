'use client'

/**
 * Admin Layout
 * Tasks: Infrastructure prerequisite for T033-T041
 * Feature: 007-contractor-interface (Phase 2 - Admin Review)
 *
 * Provides navigation and layout structure for all admin pages
 */

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Loader2,
  Briefcase,
  Package,
  Calendar,
  Languages,
  ShieldCheck,
  Image,
  Folder,
  Tag,
  UserCircle,
  Building2,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return null
  }

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin'
    },
    {
      name: 'Clients',
      href: '/admin/clients',
      icon: UserCircle,
      current: pathname?.startsWith('/admin/clients')
    },
    {
      name: 'Prestataires',
      href: '/admin/contractors',
      icon: Building2,
      current: pathname?.startsWith('/admin/contractors') && !pathname?.includes('/applications')
    },
    {
      name: 'Candidatures',
      href: '/admin/contractors/applications',
      icon: FileText,
      current: pathname?.startsWith('/admin/contractors/applications')
    },
    {
      name: 'Services',
      href: '/admin/services',
      icon: Briefcase,
      current: pathname?.startsWith('/admin/services')
    },
    {
      name: 'Catégories',
      href: '/admin/categories',
      icon: Folder,
      current: pathname?.startsWith('/admin/categories')
    },
    {
      name: 'Produits',
      href: '/admin/products',
      icon: Package,
      current: pathname?.startsWith('/admin/products')
    },
    {
      name: 'Réservations',
      href: '/admin/bookings',
      icon: Calendar,
      current: pathname?.startsWith('/admin/bookings')
    },
    {
      name: 'Codes Promo',
      href: '/admin/promotions',
      icon: Tag,
      current: pathname?.startsWith('/admin/promotions')
    },
    {
      name: 'Marchés',
      href: '/admin/markets',
      icon: Globe,
      current: pathname?.startsWith('/admin/markets')
    },
    {
      name: 'Traductions',
      href: '/admin/translations',
      icon: Languages,
      current: pathname?.startsWith('/admin/translations'),
      disabled: true
    },
    {
      name: 'Modération',
      href: '/admin/moderation',
      icon: ShieldCheck,
      current: pathname === '/admin/moderation'
    },
    {
      name: 'Images',
      href: '/admin/images',
      icon: Image,
      current: pathname?.startsWith('/admin/images')
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
      current: pathname?.startsWith('/admin/settings'),
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
            <Link href="/admin">
              <h1 className="font-playfair text-2xl font-bold text-purple-900">
                Simone Paris
              </h1>
              <p className="text-sm text-gray-600 mt-1">Administration</p>
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
                {profile.role === 'admin' ? 'Administrateur' : 'Manager'}
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

'use client'

/**
 * Admin Dashboard Page
 * Tasks: Infrastructure prerequisite for T033-T041
 * Feature: 007-contractor-interface (Phase 2 - Admin Review)
 * Route: /admin
 *
 * Main admin dashboard with statistics and navigation
 */

import { useUser } from '@/hooks/useUser'
import { useBookingStats } from '@/hooks/useAdminBookings'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  Globe,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { user, profile, isLoading } = useUser()
  const { data: bookingStats } = useBookingStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-6">
              Cette page est réservée aux administrateurs.
            </p>
            <Link href="/">
              <Button className="w-full">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
            Tableau de Bord Admin
          </h1>
          <p className="text-gray-600">
            Bienvenue, {profile.first_name} {profile.last_name}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookingStats?.pending || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Confirmées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookingStats?.confirmed || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Terminées aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookingStats?.completed_today || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">CA du mois</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookingStats?.total_revenue_month
                    ? new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                      }).format(bookingStats.total_revenue_month)
                    : '0 €'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/contractors/applications">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Candidatures</h3>
                    <p className="text-sm text-gray-600">Gérer les candidatures prestataires</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/translations">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Traductions</h3>
                    <p className="text-sm text-gray-600">Gérer les traductions multilingues</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/bookings">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Réservations</h3>
                    <p className="text-sm text-gray-600">Gérer les réservations clients</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity - Placeholder */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Activité récente</h2>
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

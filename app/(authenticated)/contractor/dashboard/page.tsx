'use client'

/**
 * Contractor Dashboard Page
 * Tasks: T148, T149 - Main contractor dashboard
 * Feature: 007-contractor-interface
 * Route: /contractor/dashboard
 *
 * Main contractor dashboard with key metrics and quick actions
 */

import { useUser } from '@/hooks/useUser'
import { useContractorStats } from '@/hooks/useContractorStats'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  CalendarClock,
  Wallet,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMemo } from 'react'

export default function ContractorDashboardPage() {
  const { user, profile, isLoading: userLoading } = useUser()
  const { data: stats, isLoading: statsLoading } = useContractorStats()

  // For now, we'll show a simple message about today's bookings
  // TODO: Implement proper today's bookings query when needed
  const todayBookings = useMemo(() => [], [])
  const bookingsLoading = false

  const isLoading = userLoading || statsLoading

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

  if (!profile || profile.role !== 'contractor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-6">
              Cette page est réservée aux prestataires.
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

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Bonjour' : today.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
            {greeting}, {profile.first_name}
          </h1>
          <p className="text-gray-600">
            {format(today, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* Profile Completion Alert */}
        {stats && stats.profile_completion < 100 && (
          <div className="mb-8">
            <Card className="bg-orange-50 border-orange-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Complétez votre profil pour recevoir plus de demandes
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Votre profil est complet à {stats.profile_completion}%. Ajoutez vos services,
                    horaires et informations professionnelles pour augmenter vos chances.
                  </p>
                  <Link href="/contractor/profile">
                    <Button variant="outline" size="sm">
                      Compléter mon profil
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Requests */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nouvelles demandes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.pending_requests || 0}
                </p>
              </div>
            </div>
          </Card>

          {/* Today's Bookings */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.today_bookings || 0}
                </p>
              </div>
            </div>
          </Card>

          {/* Month Revenue */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenus du mois</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.month_revenue
                    ? new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                      }).format(stats.month_revenue)
                    : '0 €'}
                </p>
              </div>
            </div>
          </Card>

          {/* Profile Completion */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Profil complet</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.profile_completion || 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Requests */}
            <Link href="/contractor/reservations?tab=requests">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Bell className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">Nouvelles demandes</h3>
                      {stats && stats.pending_requests > 0 && (
                        <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
                          {stats.pending_requests}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Répondre aux demandes de réservation</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Weekly Planning */}
            <Link href="/contractor/planning">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CalendarClock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Planning</h3>
                    <p className="text-sm text-gray-600">Gérer mes disponibilités</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* All Bookings */}
            <Link href="/contractor/reservations">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Toutes mes réservations</h3>
                    <p className="text-sm text-gray-600">Historique et réservations à venir</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Programme d'aujourd'hui</h2>
          {bookingsLoading ? (
            <Card className="p-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Chargement du programme...</p>
              </div>
            </Card>
          ) : todayBookings && todayBookings.length > 0 ? (
            <div className="space-y-4">
              {todayBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {booking.service_name || 'Service'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {booking.scheduled_time} • {booking.duration_minutes} min
                        </p>
                        <p className="text-sm text-gray-600">
                          📍 {booking.service_address}
                        </p>
                        {booking.client_name && (
                          <p className="text-sm text-gray-600 mt-2">
                            Client: {booking.client_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {booking.status === 'confirmed' ? 'Confirmé' :
                         booking.status === 'in_progress' ? 'En cours' : booking.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune réservation aujourd'hui</p>
                <p className="text-sm">Profitez de votre journée libre!</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

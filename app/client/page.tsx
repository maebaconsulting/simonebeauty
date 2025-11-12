'use client'

/**
 * Client Dashboard Page
 * Feature: 006-client-interface
 * Route: /client
 *
 * Main client dashboard with bookings overview and quick actions
 */

import { useUser } from '@/hooks/useUser'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  User,
  CreditCard,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Bell
} from 'lucide-react'
import Link from 'next/link'

export default function ClientDashboardPage() {
  const { user, profile, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-button-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!profile || profile.role !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-6">
              Cette page est réservée aux clients.
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
            Bienvenue, {profile.first_name}
          </h1>
          <p className="text-gray-600">
            Gérez vos réservations et profitez de nos services de bien-être à domicile
          </p>
        </div>

        {/* Primary CTA - Booking */}
        <div className="mb-8">
          <Link href="/booking/services">
            <Card className="p-8 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-button-primary via-purple-600 to-purple-700 text-white border-0 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white/25 rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Réserver un service</h2>
                    <p className="text-lg text-white/90">Massage, beauté, bien-être... à domicile</p>
                  </div>
                </div>
                <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-semibold">
                  Commencer
                </Button>
              </div>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/client/bookings">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Mes réservations</h3>
                    <p className="text-sm text-gray-600">Consultez vos rendez-vous</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/client/profile">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Mon profil</h3>
                    <p className="text-sm text-gray-600">Gérez vos informations</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/client/addresses">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Mes adresses</h3>
                    <p className="text-sm text-gray-600">Gérez vos adresses</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings - Placeholder */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Prochaines réservations</h2>
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">Aucune réservation à venir</p>
              <p className="text-sm mb-6">Réservez votre premier service de bien-être</p>
              <Link href="/booking/services">
                <Button>
                  Réserver maintenant
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gérer mon compte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/client/addresses">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Mes adresses</h3>
                </div>
                <p className="text-sm text-gray-600">Gérez vos adresses de service</p>
              </Card>
            </Link>

            <Link href="/client/payments">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Mes paiements</h3>
                </div>
                <p className="text-sm text-gray-600">Gérez vos moyens de paiement</p>
              </Card>
            </Link>

            <Link href="/client/notifications">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <p className="text-sm text-gray-600">Gérez vos préférences</p>
              </Card>
            </Link>

            <Link href="/client/bookings?status=past">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Mon historique</h3>
                </div>
                <p className="text-sm text-gray-600">Consultez vos réservations passées</p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

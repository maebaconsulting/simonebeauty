'use client'

/**
 * Client Bookings Page
 * Feature: 006-client-interface (P1)
 * Route: /client/bookings
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Calendar,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Booking {
  id: number
  scheduled_at: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service_amount: number // In cents
  services: {
    id: number
    name: string
    duration: number
    base_price: number
  }
  addresses: {
    id: number
    street: string
    city: string
    postal_code: string
  }
  contractors?: {
    id: number
    slug: string
    contractor_profiles: {
      business_name: string
    }[]
  }
}

export default function ClientBookingsPage() {
  const { user, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')

  // Fetch bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['client-bookings', selectedTab],
    queryFn: async () => {
      const res = await fetch(`/api/client/bookings?status=${selectedTab}`)
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const data = await res.json()
      return data.bookings as Booking[]
    },
    enabled: !!user,
  })

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetch(`/api/client/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to cancel booking')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] })
      toast({
        title: 'Succès',
        description: 'Réservation annulée avec succès',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleCancelBooking = (bookingId: number) => {
    if (
      confirm(
        'Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.'
      )
    ) {
      cancelBookingMutation.mutate(bookingId)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmée
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terminée
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Annulée
          </span>
        )
      default:
        return null
    }
  }

  if (userLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-button-primary animate-spin" />
      </div>
    )
  }

  const bookings = bookingsData || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/client">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
          </Link>
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
            Mes Réservations
          </h1>
          <p className="text-gray-600">
            Consultez et gérez toutes vos réservations
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upcoming">À venir</TabsTrigger>
            <TabsTrigger value="past">Passées</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées</TabsTrigger>
          </TabsList>

          {/* Upcoming Bookings */}
          <TabsContent value="upcoming">
            {bookings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">Aucune réservation à venir</p>
                  <p className="text-sm mb-6">Réservez votre prochain service de bien-être</p>
                  <Link href="/booking/services">
                    <Button>Réserver maintenant</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{booking.services.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {getStatusBadge(booking.status)}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-button-primary">
                            {(booking.service_amount / 100).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{formatDate(booking.scheduled_at)}</p>
                          <p className="text-sm text-gray-600">
                            à {formatTime(booking.scheduled_at)} • {booking.services.duration} min
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p>{booking.addresses.street}</p>
                          <p className="text-sm text-gray-600">
                            {booking.addresses.postal_code} {booking.addresses.city}
                          </p>
                        </div>
                      </div>

                      {/* Contractor */}
                      {booking.contractors && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <User className="w-5 h-5 text-gray-400" />
                          <p>{booking.contractors.contractor_profiles[0]?.business_name}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Link href={`/client/bookings/${booking.id}`}>
                          <Button variant="outline" className="flex-1">
                            Voir les détails
                          </Button>
                        </Link>
                        {booking.status !== 'cancelled' && (
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelBookingMutation.isPending}
                          >
                            {cancelBookingMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Annuler'
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Past Bookings */}
          <TabsContent value="past">
            {bookings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">Aucune réservation passée</p>
                  <p className="text-sm">Vos réservations terminées apparaîtront ici</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="opacity-90">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{booking.services.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {getStatusBadge(booking.status)}
                          </CardDescription>
                        </div>
                        <p className="text-xl font-bold text-gray-600">
                          {(booking.service_amount / 100).toFixed(2)} €
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <p>{formatDate(booking.scheduled_at)} à {formatTime(booking.scheduled_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Cancelled Bookings */}
          <TabsContent value="cancelled">
            {bookings.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <X className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">Aucune réservation annulée</p>
                  <p className="text-sm">Les réservations annulées apparaîtront ici</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-gray-600">{booking.services.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {getStatusBadge(booking.status)}
                          </CardDescription>
                        </div>
                        <p className="text-xl font-bold text-gray-500 line-through">
                          {(booking.service_amount / 100).toFixed(2)} €
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-gray-500">
                        <Calendar className="w-5 h-5" />
                        <p>{formatDate(booking.scheduled_at)} à {formatTime(booking.scheduled_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

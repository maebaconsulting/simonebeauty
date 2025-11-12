'use client'

/**
 * Client Booking Details Page
 * Feature: 006-client-interface (P1 - User Story 2)
 * Route: /client/bookings/[id]
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Calendar,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
  X,
  CreditCard,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface BookingDetail {
  id: number
  client_id: string
  contractor_id?: string
  service_id: number
  scheduled_datetime: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  service_name: string
  service_amount: number // In cents
  service_address: string
  service_city: string
  service_postal_code: string
  client_name: string
  client_email: string
  client_phone: string
  contractor_name?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  payment_intent_id?: string
  payment_status?: string
  created_at: string
  updated_at: string
  services?: {
    id: number
    name: string
    description?: string
    base_duration_minutes: number
    base_price: number
  }
  address?: {
    street: string
    city: string
    postal_code: string
  }
  contractor?: {
    id: string
    name: string
  }
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const bookingId = params.id as string

  // Fetch booking details
  const { data: bookingData, isLoading, error } = useQuery({
    queryKey: ['client-booking-detail', bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/client/bookings/${bookingId}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch booking')
      }
      const data = await res.json()
      return data.booking as BookingDetail
    },
  })

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ['client-booking-detail', bookingId] })
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] })
      toast({
        title: 'Succès',
        description: 'Réservation annulée avec succès. Vous serez remboursé sous 5-10 jours.',
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

  const handleCancelBooking = () => {
    if (
      confirm(
        'Êtes-vous sûr de vouloir annuler cette réservation ? Vous serez remboursé intégralement si l\'annulation est effectuée plus de 24h avant le rendez-vous.'
      )
    ) {
      cancelBookingMutation.mutate()
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-2" />
            En attente
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmée
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Clock className="w-4 h-4 mr-2" />
            En cours
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            Terminée
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <X className="w-4 h-4 mr-2" />
            Annulée
          </span>
        )
      default:
        return null
    }
  }

  const canCancelBooking = (booking: BookingDetail) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false
    }
    const scheduledTime = new Date(booking.scheduled_datetime)
    const now = new Date()
    const hoursDiff = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursDiff >= 24
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-button-primary animate-spin" />
      </div>
    )
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/client/bookings">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux réservations
            </Button>
          </Link>
          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Impossible de charger les détails de la réservation
              </h2>
              <p className="text-gray-600">
                {error instanceof Error ? error.message : 'Une erreur est survenue'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const booking = bookingData

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/client/bookings">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux réservations
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
                Détails de la réservation
              </h1>
              <p className="text-gray-600">Référence #{booking.id}</p>
            </div>
            <div>{getStatusBadge(booking.status)}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {booking.services?.name || booking.service_name}
                  </h3>
                  {booking.services?.description && (
                    <p className="text-gray-600">{booking.services.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>
                    {booking.services?.base_duration_minutes || booking.duration_minutes} minutes
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle>Date et Heure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{formatDate(booking.scheduled_datetime)}</p>
                    <p className="text-sm text-gray-600">
                      à {formatTime(booking.scheduled_datetime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse du service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">
                      {booking.address?.street || booking.service_address}
                    </p>
                    <p className="text-gray-600">
                      {booking.address?.postal_code || booking.service_postal_code}{' '}
                      {booking.address?.city || booking.service_city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contractor Info */}
            {(booking.contractor || booking.contractor_name) && (
              <Card>
                <CardHeader>
                  <CardTitle>Prestataire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                    <p className="font-medium">
                      {booking.contractor?.name || booking.contractor_name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Vos informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 text-gray-700">
                  <User className="w-5 h-5 text-gray-400" />
                  <p>{booking.client_name}</p>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <p>{booking.client_email}</p>
                </div>
                {booking.client_phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <p>{booking.client_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant du service</span>
                  <span className="text-2xl font-bold text-button-primary">
                    {(booking.service_amount / 100).toFixed(2)} €
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Paiement {booking.payment_status === 'succeeded' ? 'effectué' : 'en attente'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Cancel Button */}
                {canCancelBooking(booking) && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelBooking}
                    disabled={cancelBookingMutation.isPending}
                  >
                    {cancelBookingMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Annulation...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 w-4 h-4" />
                        Annuler la réservation
                      </>
                    )}
                  </Button>
                )}

                {/* Contact Contractor */}
                {booking.contractor && booking.status !== 'cancelled' && (
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 w-4 h-4" />
                    Contacter le prestataire
                  </Button>
                )}

                {/* Cancellation Policy */}
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <p className="font-semibold mb-1">Politique d'annulation :</p>
                    <p>
                      • Annulation gratuite jusqu'à 24h avant le rendez-vous
                    </p>
                    <p>• Remboursement sous 5-10 jours ouvrés</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Créée le :</span>
                  <br />
                  {new Date(booking.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                {booking.payment_intent_id && (
                  <div>
                    <span className="font-medium">Référence paiement :</span>
                    <br />
                    <span className="text-xs font-mono">
                      {booking.payment_intent_id.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

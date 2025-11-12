'use client'

/**
 * Admin Booking Details Page
 * Feature: Admin Back Office - Booking Management
 * SpecKit: spec 005 User Story 5 - Gestion des Réservations
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminBooking, useCapturePayment, useCancelBooking } from '@/hooks/useAdminBookings'
import { CapturePaymentModal } from '@/components/admin/CapturePaymentModal'
import { CancelBookingModal } from '@/components/admin/CancelBookingModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Globe,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminBookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  // Mutations
  const capturePaymentMutation = useCapturePayment()
  const cancelBookingMutation = useCancelBooking()

  // Fetch booking details
  const { data: booking, isLoading, error, refetch } = useAdminBooking(bookingId)

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountInCents / 100)
  }

  const formatDate = (datetime: string, timezone: string = 'Europe/Paris') => {
    return new Date(datetime).toLocaleDateString('fr-FR', {
      timeZone: timezone,
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (datetime: string, timezone: string = 'Europe/Paris') => {
    return new Date(datetime).toLocaleTimeString('fr-FR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800' },
      completed_by_contractor: { label: 'Terminé (prestataire)', color: 'bg-indigo-100 text-indigo-800' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
      refunded: { label: 'Remboursé', color: 'bg-gray-100 text-gray-800' },
    }
    const badge = badges[status as keyof typeof badges] || badges.pending

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getMarketBadge = (market: { code: string; name: string; currency_code: string } | null | undefined) => {
    if (!market) return null

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
        <Globe className="w-3.5 h-3.5" />
        <span>{market.name}</span>
        <span className="text-xs opacity-75">({market.code})</span>
      </span>
    )
  }

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

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600 mb-6">
              Impossible de charger les détails de la réservation.
            </p>
            <Link href="/admin/bookings">
              <Button>Retour à la liste</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const canCapture = ['in_progress', 'completed_by_contractor'].includes(booking.status) &&
                     booking.payment_status !== 'captured'
  const canCancel = ['pending', 'confirmed'].includes(booking.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/bookings">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Réservation #{booking.id}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(booking.status)}
                {booking.contractor?.market && getMarketBadge(booking.contractor.market)}
                {booking.payment_status && (
                  <span className="text-sm text-gray-600">
                    Paiement: <strong>{booking.payment_status}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(booking.service_amount)}
              </div>
              {booking.tip_amount > 0 && (
                <div className="text-sm text-gray-600">
                  + {formatCurrency(booking.tip_amount)} tip
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Service</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Nom du service</span>
                  <div className="text-lg font-medium text-gray-900">
                    {booking.service_name || booking.service?.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Date
                    </span>
                    <div className="font-medium text-gray-900">
                      {formatDate(booking.scheduled_datetime, booking.booking_timezone)}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Heure
                    </span>
                    <div className="font-medium text-gray-900">
                      {formatTime(booking.scheduled_datetime, booking.booking_timezone)} ({booking.duration_minutes} min)
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Adresse
                  </span>
                  <div className="font-medium text-gray-900">
                    {booking.service_address}
                    {booking.service_city && (
                      <div className="text-sm text-gray-600">
                        {booking.service_postal_code} {booking.service_city}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Client Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Client
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Nom</span>
                    <div className="font-medium text-gray-900">
                      {booking.client_name || `${booking.client_profile?.first_name} ${booking.client_profile?.last_name}`}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">Email</span>
                    <div className="font-medium text-gray-900">
                      {booking.client_email || booking.client_profile?.email}
                    </div>
                  </div>
                </div>

                {booking.client_phone && (
                  <div>
                    <span className="text-sm text-gray-600">Téléphone</span>
                    <div className="font-medium text-gray-900">
                      {booking.client_phone}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Contractor Information */}
            {booking.contractor_profile && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Prestataire
                </h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Nom</span>
                      <div className="font-medium text-gray-900">
                        {booking.contractor_profile.first_name} {booking.contractor_profile.last_name}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Email</span>
                      <div className="font-medium text-gray-900">
                        {booking.contractor_profile.email}
                      </div>
                    </div>
                  </div>

                  {booking.contractor_profile.professional_title && (
                    <div>
                      <span className="text-sm text-gray-600">Titre professionnel</span>
                      <div className="font-medium text-gray-900">
                        {booking.contractor_profile.professional_title}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Action Logs Timeline */}
            {booking.action_logs && booking.action_logs.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Historique des actions
                </h2>
                <div className="space-y-3">
                  {booking.action_logs.map((log) => (
                    <div key={log.id} className="flex gap-3 border-l-2 border-gray-200 pl-4 pb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {log.action_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            par {log.performed_by_type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(log.created_at)}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Paiement
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Montant service</span>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(booking.service_amount)}
                  </div>
                </div>

                {booking.tip_amount > 0 && (
                  <div>
                    <span className="text-gray-600">Pourboire</span>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(booking.tip_amount)}
                    </div>
                  </div>
                )}

                {booking.stripe_payment_intent_id && (
                  <div>
                    <span className="text-gray-600">Payment Intent ID</span>
                    <div className="font-mono text-xs text-gray-700 break-all">
                      {booking.stripe_payment_intent_id}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-gray-600">Statut</span>
                  <div className="font-semibold text-gray-900">
                    {booking.payment_status === 'authorized' && 'Pré-autorisé'}
                    {booking.payment_status === 'captured' && 'Capturé'}
                    {booking.payment_status === 'refunded' && 'Remboursé'}
                    {booking.payment_status === 'cancelled' && 'Annulé'}
                    {booking.payment_status === 'pending' && 'En attente'}
                  </div>
                </div>
              </div>

              {canCapture && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-800 mb-2">
                    Paiement pré-autorisé mais non capturé
                  </div>
                  <Button
                    onClick={() => setIsCaptureModalOpen(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Capturer maintenant
                  </Button>
                </div>
              )}
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

              <div className="space-y-2">
                {canCapture && (
                  <Button
                    onClick={() => setIsCaptureModalOpen(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Capturer paiement
                  </Button>
                )}

                {canCancel && (
                  <Button
                    onClick={() => setIsCancelModalOpen(true)}
                    variant="outline"
                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Annuler réservation
                  </Button>
                )}

                {!canCapture && !canCancel && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    Aucune action disponible pour cette réservation
                  </p>
                )}
              </div>
            </Card>

            {/* Timestamps */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Horodatage</h2>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Créée le</span>
                  <div className="text-gray-900">{formatDateTime(booking.created_at)}</div>
                </div>

                {booking.completed_at && (
                  <div>
                    <span className="text-gray-600">Terminée le</span>
                    <div className="text-gray-900">{formatDateTime(booking.completed_at)}</div>
                  </div>
                )}

                {booking.cancelled_at && (
                  <div>
                    <span className="text-gray-600">Annulée le</span>
                    <div className="text-gray-900">{formatDateTime(booking.cancelled_at)}</div>
                  </div>
                )}

                <div>
                  <span className="text-gray-600">Dernière mise à jour</span>
                  <div className="text-gray-900">{formatDateTime(booking.updated_at)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CapturePaymentModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onCapture={async (data) => {
          await capturePaymentMutation.mutateAsync({
            bookingId: booking.id,
            ...data,
          })
          setIsCaptureModalOpen(false)
          refetch()
        }}
        booking={booking}
      />

      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onCancel={async (data) => {
          await cancelBookingMutation.mutateAsync({
            booking_id: booking.id,
            ...data,
          })
          setIsCancelModalOpen(false)
          router.push('/admin/bookings')
        }}
        booking={booking}
      />
    </div>
  )
}

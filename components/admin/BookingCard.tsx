'use client'

/**
 * Booking Card Component
 * Feature: Admin Back Office - Booking Management
 * SpecKit: spec 005 User Story 5
 * Pattern: Follows ApplicationCard.tsx design system
 */

import { AdminBookingWithDetails, AdminBookingStatus, AdminPaymentStatus } from '@/types/booking'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react'
import Link from 'next/link'

interface BookingCardProps {
  booking: AdminBookingWithDetails
  onCapturePayment?: (bookingId: number) => void
  onCancelBooking?: (bookingId: number) => void
}

export function BookingCard({
  booking,
  onCapturePayment,
  onCancelBooking
}: BookingCardProps) {
  const getStatusBadge = (status: AdminBookingStatus) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800', icon: Calendar },
      in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
      completed_by_contractor: { label: 'Terminé (prestataire)', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
      refunded: { label: 'Remboursé', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    }
    const badge = badges[status]
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: AdminPaymentStatus | null) => {
    if (!status) return null

    const badges = {
      pending: { label: 'En attente', color: 'bg-gray-100 text-gray-700' },
      authorized: { label: 'Pré-autorisé', color: 'bg-blue-100 text-blue-700' },
      captured: { label: 'Capturé', color: 'bg-green-100 text-green-700' },
      failed: { label: 'Échoué', color: 'bg-red-100 text-red-700' },
      refunded: { label: 'Remboursé', color: 'bg-orange-100 text-orange-700' },
      cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-700' },
    }
    const badge = badges[status]

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        <CreditCard className="w-3 h-3" />
        {badge.label}
      </span>
    )
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

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountInCents / 100)
  }

  // Determine available actions based on status
  const canCapture = ['in_progress', 'completed_by_contractor'].includes(booking.status) &&
                     booking.payment_status !== 'captured'
  const canCancel = ['pending', 'confirmed'].includes(booking.status)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              Réservation #{booking.id}
            </h3>
            {getStatusBadge(booking.status)}
            {getPaymentStatusBadge(booking.payment_status)}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {booking.client_name || booking.client_profile?.first_name + ' ' + booking.client_profile?.last_name || 'Client inconnu'}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(booking.scheduled_datetime, booking.booking_timezone)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(booking.scheduled_datetime, booking.booking_timezone)} ({booking.duration_minutes} min)
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(booking.service_amount)}
          </div>
          {booking.tip_amount > 0 && (
            <div className="text-sm text-gray-600">
              + {formatCurrency(booking.tip_amount)} tip
            </div>
          )}
        </div>
      </div>

      {/* Service and Location */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
            {booking.service_name || booking.service?.name || 'Service inconnu'}
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {booking.service_address}
            {booking.service_city && `, ${booking.service_postal_code} ${booking.service_city}`}
          </span>
        </div>
      </div>

      {/* Contractor Info */}
      {booking.contractor_profile && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Prestataire:</span>{' '}
            {booking.contractor_profile.first_name} {booking.contractor_profile.last_name}
            {booking.contractor_profile.professional_title && (
              <span className="text-gray-500"> • {booking.contractor_profile.professional_title}</span>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Info */}
      {booking.status === 'cancelled' && booking.cancellation_reason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="text-sm font-medium text-red-800 mb-1">Raison de l'annulation:</h4>
          <p className="text-sm text-red-700">{booking.cancellation_reason}</p>
        </div>
      )}

      {/* Payment Info for Capture */}
      {canCapture && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">
              Paiement pré-autorisé - Capture manuelle requise
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        <Link href={`/admin/bookings/${booking.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            Voir détails
          </Button>
        </Link>

        {canCapture && onCapturePayment && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCapturePayment(booking.id)}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Capturer paiement
          </Button>
        )}

        {canCancel && onCancelBooking && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancelBooking(booking.id)}
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Annuler
          </Button>
        )}
      </div>
    </div>
  )
}

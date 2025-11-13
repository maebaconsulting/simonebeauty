'use client'

/**
 * Booking Table Component
 * Feature: Admin Back Office - Booking Management
 * SpecKit: spec 005 User Story 5
 * Provides a compact list/table view of bookings
 */

import { AdminBookingWithDetails, AdminBookingStatus, AdminPaymentStatus } from '@/types/booking'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Globe,
} from 'lucide-react'
import Link from 'next/link'

interface BookingTableProps {
  bookings: AdminBookingWithDetails[]
  onConfirmBooking?: (bookingId: number) => void
  onCapturePayment?: (bookingId: number) => void
  onCancelBooking?: (bookingId: number) => void
}

export function BookingTable({
  bookings,
  onConfirmBooking,
  onCapturePayment,
  onCancelBooking
}: BookingTableProps) {
  const getMarketColor = (code: string): string => {
    const colors: Record<string, string> = {
      FR: 'bg-blue-100 text-blue-800 border-blue-200',
      BE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CH: 'bg-red-100 text-red-800 border-red-200',
      LU: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      CA: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return colors[code] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

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
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
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
      day: '2-digit',
      month: 'short',
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
  const canConfirm = (booking: AdminBookingWithDetails) => {
    return booking.status === 'pending'
  }

  const canCapture = (booking: AdminBookingWithDetails) => {
    return ['in_progress', 'completed_by_contractor'].includes(booking.status) &&
           booking.payment_status !== 'captured'
  }

  const canCancel = (booking: AdminBookingWithDetails) => {
    return ['pending', 'confirmed'].includes(booking.status)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date & Heure
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Service & Marché
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Paiement
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                {/* ID */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    #{booking.id}
                  </div>
                </td>

                {/* Client */}
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">
                    {booking.client_name ||
                     (booking.client_profile?.first_name && booking.client_profile?.last_name
                       ? `${booking.client_profile.first_name} ${booking.client_profile.last_name}`
                       : 'Client inconnu')}
                  </div>
                  {booking.client_email && (
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                      {booking.client_email}
                    </div>
                  )}
                </td>

                {/* Date & Time */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {formatDate(booking.scheduled_datetime, booking.booking_timezone)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {formatTime(booking.scheduled_datetime, booking.booking_timezone)} ({booking.duration_minutes} min)
                  </div>
                </td>

                {/* Service & Market */}
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {booking.service_name || booking.service?.name || 'Service inconnu'}
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {booking.contractor?.market && (
                      <div className={`flex items-center gap-1 px-2 py-0.5 border rounded text-xs font-medium ${getMarketColor(booking.contractor.market.code)}`}>
                        <Globe className="w-3 h-3" />
                        {booking.contractor.market.code}
                      </div>
                    )}
                    {booking.service_city && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {booking.service_city}
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(booking.status)}
                </td>

                {/* Payment */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {getPaymentStatusBadge(booking.payment_status)}
                </td>

                {/* Amount */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(booking.service_amount)}
                  </div>
                  {booking.tip_amount > 0 && (
                    <div className="text-xs text-gray-500">
                      + {formatCurrency(booking.tip_amount)} tip
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </Link>

                    {canConfirm(booking) && onConfirmBooking && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onConfirmBooking(booking.id)}
                        className="h-7 px-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        title="Confirmer"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}

                    {canCapture(booking) && onCapturePayment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCapturePayment(booking.id)}
                        className="h-7 px-2 border-green-600 text-green-600 hover:bg-green-50"
                        title="Capturer paiement"
                      >
                        <DollarSign className="w-3 h-3" />
                      </Button>
                    )}

                    {canCancel(booking) && onCancelBooking && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancelBooking(booking.id)}
                        className="h-7 px-2 border-red-600 text-red-600 hover:bg-red-50"
                        title="Annuler"
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucune réservation trouvée</p>
        </div>
      )}
    </div>
  )
}

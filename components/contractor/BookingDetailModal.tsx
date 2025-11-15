'use client'

/**
 * BookingDetailModal Component
 * Task: T083
 * Feature: 007-contractor-interface
 *
 * Modal displaying full booking details
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Package,
  Euro,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import type { Booking } from './BookingCard'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BookingDetailModalProps {
  booking: Booking | null
  open: boolean
  onClose: () => void
}

export function BookingDetailModal({
  booking,
  open,
  onClose,
}: BookingDetailModalProps) {
  if (!booking) return null

  // Convert UTC datetime to Paris local time
  const scheduledDateTimeUTC = parseISO(booking.scheduled_datetime)

  // Format date in Paris timezone
  const formatDate = () => {
    return scheduledDateTimeUTC.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    })
  }

  // Format time in Paris timezone
  const formatTime = () => {
    return scheduledDateTimeUTC.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
      hour12: false,
    })
  }

  const formatDateTime = (dateTimeString: string | null | undefined) => {
    if (!dateTimeString) return 'N/A'
    try {
      const date = parseISO(dateTimeString)
      return format(date, 'PPP à HH:mm', { locale: fr })
    } catch {
      return dateTimeString
    }
  }

  // Status badge
  const getStatusBadge = () => {
    switch (booking.status) {
      case 'confirmed':
        return (
          <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Confirmée</span>
          </div>
        )
      case 'in_progress':
        return (
          <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">En cours</span>
          </div>
        )
      case 'completed':
        return (
          <div className="inline-flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Terminée</span>
          </div>
        )
      case 'cancelled':
        return (
          <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
            <XCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Annulée</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails de la réservation</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            Référence: #{booking.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-semibold text-gray-700">Date</p>
              </div>
              <p className="text-gray-900">{formatDate()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-semibold text-gray-700">Heure</p>
              </div>
              <p className="text-gray-900">
                {formatTime()} ({booking.duration_minutes} min)
              </p>
            </div>
          </div>

          {/* Service Info */}
          {booking.service_name && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-semibold text-gray-700">Service</p>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-3">{booking.service_name}</p>
              {booking.service_address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{booking.service_address}</p>
                    {(booking.service_city || booking.service_postal_code) && (
                      <p>
                        {booking.service_postal_code} {booking.service_city}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-gray-700">Informations client</p>
            </div>
            <div className="space-y-2">
              {booking.client_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{booking.client_name}</span>
                </div>
              )}
              {booking.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${booking.client_phone}`} className="text-purple-600 hover:underline">
                    {booking.client_phone}
                  </a>
                </div>
              )}
              {booking.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${booking.client_email}`} className="text-purple-600 hover:underline">
                    {booking.client_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-gray-700">Paiement</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Montant total</span>
              <span className="text-2xl font-bold text-purple-900">
                {booking.service_amount.toFixed(2)}€
              </span>
            </div>
            {booking.payment_status && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-600">
                  Statut: <span className="font-medium">{booking.payment_status}</span>
                </span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-3">Historique</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Créée le:</span>
                <span className="font-medium">{formatDateTime(booking.created_at)}</span>
              </div>
              {booking.confirmed_at && (
                <div className="flex justify-between">
                  <span>Confirmée le:</span>
                  <span className="font-medium">{formatDateTime(booking.confirmed_at)}</span>
                </div>
              )}
              {booking.started_at && (
                <div className="flex justify-between">
                  <span>Démarrée le:</span>
                  <span className="font-medium">{formatDateTime(booking.started_at)}</span>
                </div>
              )}
              {booking.completed_at && (
                <div className="flex justify-between">
                  <span>Terminée le:</span>
                  <span className="font-medium">{formatDateTime(booking.completed_at)}</span>
                </div>
              )}
              {booking.cancelled_at && (
                <div className="flex justify-between">
                  <span>Annulée le:</span>
                  <span className="font-medium">{formatDateTime(booking.cancelled_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

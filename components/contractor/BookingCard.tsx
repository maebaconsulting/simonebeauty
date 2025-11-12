'use client'

/**
 * BookingCard Component
 * Task: T076
 * Feature: 007-contractor-interface
 *
 * Displays a confirmed/in_progress booking with details
 * Includes "Mark as Completed" button for in_progress bookings
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Package,
  Euro,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  MapPinIcon
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface Booking {
  id: number
  scheduled_datetime: string // TIMESTAMPTZ in UTC
  booking_timezone?: string // e.g., 'Europe/Paris'
  duration_minutes: number
  service_name?: string
  service_address?: string
  service_city?: string
  service_postal_code?: string
  service_amount: number
  client_name?: string
  client_phone?: string
  client_email?: string
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  confirmed_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  payment_status?: string
  created_at: string
  updated_at: string
}

interface BookingCardProps {
  booking: Booking
  onMarkCompleted?: (bookingId: number) => void
  showActions?: boolean
  isProcessing?: boolean
}

export function BookingCard({
  booking,
  onMarkCompleted,
  showActions = true,
  isProcessing = false
}: BookingCardProps) {
  const [showDetails, setShowDetails] = useState(false)

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
    if (!dateTimeString) return null
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
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Confirmée</span>
          </div>
        )
      case 'in_progress':
        return (
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">En cours</span>
          </div>
        )
      case 'completed':
        return (
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Terminée</span>
          </div>
        )
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Annulée</span>
          </div>
        )
      default:
        return null
    }
  }

  // Check if booking can be marked as completed
  const canMarkCompleted = booking.status === 'in_progress' && showActions

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-purple-600" />
            <p className="text-lg font-semibold text-gray-900">
              {formatDate()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatTime()} ({booking.duration_minutes} min)</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge()}
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
            <Euro className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-purple-900">
              {booking.service_amount.toFixed(2)}€
            </span>
          </div>
        </div>
      </div>

      {/* Service Info */}
      {booking.service_name && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-gray-600" />
            <p className="font-medium text-gray-900">{booking.service_name}</p>
          </div>
          {booking.service_address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                {booking.service_address}
                {booking.service_city && `, ${booking.service_city}`}
                {booking.service_postal_code && ` ${booking.service_postal_code}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Client Info */}
      <div className="mb-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Informations client</h4>
        {booking.client_name && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4 text-gray-500" />
            <span>{booking.client_name}</span>
          </div>
        )}
        {booking.client_phone && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-gray-500" />
            <a href={`tel:${booking.client_phone}`} className="hover:text-purple-600 hover:underline">
              {booking.client_phone}
            </a>
          </div>
        )}
        {booking.client_email && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail className="w-4 h-4 text-gray-500" />
            <a href={`mailto:${booking.client_email}`} className="hover:text-purple-600 hover:underline">
              {booking.client_email}
            </a>
          </div>
        )}
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-purple-600 hover:text-purple-700 mb-4"
      >
        {showDetails ? '▼' : '▶'} Détails de la réservation
      </button>

      {showDetails && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
          {booking.confirmed_at && (
            <p><strong>Confirmée le:</strong> {formatDateTime(booking.confirmed_at)}</p>
          )}
          {booking.started_at && (
            <p><strong>Démarrée le:</strong> {formatDateTime(booking.started_at)}</p>
          )}
          {booking.completed_at && (
            <p><strong>Terminée le:</strong> {formatDateTime(booking.completed_at)}</p>
          )}
          {booking.cancelled_at && (
            <p><strong>Annulée le:</strong> {formatDateTime(booking.cancelled_at)}</p>
          )}
          {booking.payment_status && (
            <p><strong>Statut du paiement:</strong> {booking.payment_status}</p>
          )}
        </div>
      )}

      {/* Action: Mark as Completed */}
      {canMarkCompleted && onMarkCompleted && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Service en cours :</strong> Une fois le service terminé, cliquez sur le bouton ci-dessous pour marquer cette réservation comme terminée.
            </p>
          </div>
          <Button
            onClick={() => onMarkCompleted(booking.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isProcessing}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marquer comme terminée
          </Button>
        </div>
      )}
    </Card>
  )
}

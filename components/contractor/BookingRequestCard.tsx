'use client'

/**
 * BookingRequestCard Component
 * Task: T068
 * Feature: 007-contractor-interface
 *
 * Displays a booking request with client info, service details,
 * date/time, address, price, and Accept/Refuse buttons
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
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { BookingRequest } from '@/types/contractor'
import { format, parseISO, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BookingRequestCardProps {
  request: BookingRequest
  onAccept: (requestId: number) => void
  onRefuse: (requestId: number) => void
  isProcessing?: boolean
}

export function BookingRequestCard({
  request,
  onAccept,
  onRefuse,
  isProcessing = false
}: BookingRequestCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const { booking } = request

  if (!booking) {
    return null
  }

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

  // Calculate time remaining
  const expiresAt = parseISO(request.expires_at)
  const now = new Date()
  const hoursRemaining = differenceInHours(expiresAt, now)
  const isExpiringSoon = hoursRemaining <= 6

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = parseISO(dateTimeString)
      return format(date, 'PPP à HH:mm', { locale: fr })
    } catch {
      return dateTimeString
    }
  }

  return (
    <Card className={`p-6 ${isExpiringSoon ? 'border-l-4 border-l-orange-500' : ''}`}>
      {/* Expiration Warning */}
      {isExpiringSoon && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-900">
              Répondez rapidement !
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Cette demande expire dans {hoursRemaining}h (le {formatDateTime(request.expires_at)})
            </p>
          </div>
        </div>
      )}

      {/* Request Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
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
        <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
          <Euro className="w-5 h-5 text-purple-600" />
          <span className="text-lg font-bold text-purple-900">
            {booking.service_amount.toFixed(2)}€
          </span>
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
              </p>
            </div>
          )}
        </div>
      )}

      {/* Client Info */}
      <div className="mb-6 space-y-2">
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
        {showDetails ? '▼' : '▶'} Détails de la demande
      </button>

      {showDetails && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
          <p><strong>Demande reçue:</strong> {formatDateTime(request.requested_at)}</p>
          <p><strong>Expire le:</strong> {formatDateTime(request.expires_at)}</p>
          <p><strong>Délai restant:</strong> {hoursRemaining}h</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => onRefuse(request.id)}
          variant="outline"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={isProcessing}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Refuser
        </Button>
        <Button
          onClick={() => onAccept(request.id)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          disabled={isProcessing}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Accepter
        </Button>
      </div>

      {/* Important Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Important :</strong> En acceptant cette demande, le paiement du client sera automatiquement capturé et la réservation sera confirmée.
        </p>
      </div>
    </Card>
  )
}

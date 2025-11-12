'use client'

/**
 * BookingCard Component
 * Task: T064
 * Feature: 007-contractor-interface
 *
 * Displays a booking with status color coding
 */

import { MapPin, Clock, User, Package, Car } from 'lucide-react'
import type { ContractorBooking, BookingStatus } from '@/types/contractor'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BookingCardProps {
  booking: ContractorBooking
  onClick?: () => void
}

const STATUS_CONFIG: Record<BookingStatus, {
  label: string
  bg: string
  border: string
  text: string
  icon: string
}> = {
  pending: {
    label: 'En attente',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'bg-yellow-100',
  },
  confirmed: {
    label: 'Confirmé',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'bg-green-100',
  },
  in_progress: {
    label: 'En cours',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'bg-blue-100',
  },
  completed: {
    label: 'Terminé',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'bg-gray-100',
  },
  cancelled: {
    label: 'Annulé',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'bg-red-100',
  },
}

export function BookingCard({ booking, onClick }: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status]

  const formatTime = (time: string) => {
    // TIME format: HH:MM:SS -> HH:MM
    return time.substring(0, 5)
  }

  return (
    <div
      className={`rounded-lg border-l-4 ${statusConfig.border} ${statusConfig.bg} p-3 cursor-pointer hover:shadow-md transition-all`}
      onClick={onClick}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
          {statusConfig.label}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{formatTime(booking.scheduled_start_time)} - {formatTime(booking.scheduled_end_time)}</span>
        </div>
      </div>

      {/* Service name */}
      {booking.service_name && (
        <div className="flex items-start gap-2 mb-2">
          <div className={`flex-shrink-0 w-6 h-6 rounded ${statusConfig.icon} flex items-center justify-center`}>
            <Package className={`w-3.5 h-3.5 ${statusConfig.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${statusConfig.text} truncate`}>
              {booking.service_name}
            </p>
            {booking.service_duration && (
              <p className="text-xs text-gray-500">
                Durée: {booking.service_duration} min
              </p>
            )}
          </div>
        </div>
      )}

      {/* Client name */}
      {booking.client_name && (
        <div className="flex items-center gap-2 mb-1">
          <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-700 truncate">{booking.client_name}</span>
        </div>
      )}

      {/* Client address */}
      {booking.client_address && (
        <div className="flex items-start gap-2 mb-2">
          <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-gray-600 line-clamp-2">{booking.client_address}</span>
        </div>
      )}

      {/* Travel time (if available) */}
      {(booking.travel_time_before || booking.travel_time_after) && (
        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2">
          <Car className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-600">
            Trajet:{' '}
            {booking.travel_time_before ? `${booking.travel_time_before}min avant` : ''}
            {booking.travel_time_before && booking.travel_time_after ? ' • ' : ''}
            {booking.travel_time_after ? `${booking.travel_time_after}min après` : ''}
          </span>
        </div>
      )}
    </div>
  )
}

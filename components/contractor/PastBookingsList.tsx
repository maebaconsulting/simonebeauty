'use client'

/**
 * PastBookingsList Component
 * Task: T082
 * Feature: 007-contractor-interface
 *
 * Displays past bookings (completed/cancelled) with infinite scroll
 */

import { BookingCard, type Booking } from './BookingCard'
import { Card } from '@/components/ui/card'
import { History, Loader2 } from 'lucide-react'

interface PastBookingsListProps {
  bookings: Booking[]
  isLoading: boolean
}

export function PastBookingsList({
  bookings,
  isLoading
}: PastBookingsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <History className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun historique
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            L'historique de vos prestations passées apparaîtra ici.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          showActions={false}
          isProcessing={false}
        />
      ))}
    </div>
  )
}

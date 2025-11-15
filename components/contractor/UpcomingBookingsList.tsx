'use client'

/**
 * UpcomingBookingsList Component
 * Task: T081
 * Feature: 007-contractor-interface
 *
 * Displays upcoming bookings grouped by date
 * Includes in_progress and confirmed bookings
 */

import { BookingCard, type Booking } from './BookingCard'
import { Card } from '@/components/ui/card'
import { Calendar, Loader2 } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UpcomingBookingsListProps {
  bookings: Booking[]
  isLoading: boolean
  onMarkCompleted?: (bookingId: number) => void
  isProcessing?: boolean
}

export function UpcomingBookingsList({
  bookings,
  isLoading,
  onMarkCompleted,
  isProcessing = false
}: UpcomingBookingsListProps) {
  // Group bookings by date (extract date from scheduled_datetime in Paris timezone)
  const groupedBookings = bookings.reduce((groups, booking) => {
    const scheduledDateTimeUTC = parseISO(booking.scheduled_datetime)
    // Extract date in Paris timezone (format: YYYY-MM-DD)
    const date = scheduledDateTimeUTC.toLocaleDateString('en-CA', {
      timeZone: 'Europe/Paris',
    })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(booking)
    return groups
  }, {} as Record<string, Booking[]>)

  // Sort dates
  const sortedDates = Object.keys(groupedBookings).sort()

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune réservation à venir
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Vos prochaines prestations confirmées apparaîtront ici.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dateObj = parseISO(date)
        const dateLabel = format(dateObj, 'EEEE d MMMM yyyy', { locale: fr })
        const bookingsForDate = groupedBookings[date]

        return (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {dateLabel}
              </h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Bookings for this date */}
            <div className="space-y-3">
              {bookingsForDate.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onMarkCompleted={onMarkCompleted}
                  showActions={true}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

/**
 * PlanningCalendar Component
 * Task: T062
 * Feature: 007-contractor-interface
 *
 * Weekly calendar view with bookings
 * Integrates with Realtime subscription (T063)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookingCard } from './BookingCard'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import type { ContractorBooking } from '@/types/contractor'
import { addWeeks, subWeeks, format, parseISO, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PlanningCalendarProps {
  bookings: ContractorBooking[]
  weekStart: Date
  weekEnd: Date
  onWeekChange: (newWeekDate: Date) => void
  isLoading?: boolean
  onRefresh?: () => void
}

const DAYS_OF_WEEK = [
  { key: 1, label: 'Lundi', shortLabel: 'Lun' },
  { key: 2, label: 'Mardi', shortLabel: 'Mar' },
  { key: 3, label: 'Mercredi', shortLabel: 'Mer' },
  { key: 4, label: 'Jeudi', shortLabel: 'Jeu' },
  { key: 5, label: 'Vendredi', shortLabel: 'Ven' },
  { key: 6, label: 'Samedi', shortLabel: 'Sam' },
  { key: 0, label: 'Dimanche', shortLabel: 'Dim' },
]

export function PlanningCalendar({
  bookings,
  weekStart,
  weekEnd,
  onWeekChange,
  isLoading = false,
  onRefresh,
}: PlanningCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const date = booking.scheduled_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(booking)
    return acc
  }, {} as Record<string, ContractorBooking[]>)

  // Generate week days
  const weekDays = DAYS_OF_WEEK.map((day) => {
    const dayDate = new Date(weekStart)
    // Adjust to the right day of week
    const daysToAdd = day.key === 0 ? 6 : day.key - 1 // Sunday is 6 days after Monday
    dayDate.setDate(weekStart.getDate() + daysToAdd)

    const dateStr = format(dayDate, 'yyyy-MM-dd')
    const dayBookings = bookingsByDate[dateStr] || []

    // Sort bookings by start time
    dayBookings.sort((a, b) => a.scheduled_start_time.localeCompare(b.scheduled_start_time))

    return {
      ...day,
      date: dayDate,
      dateStr,
      bookings: dayBookings,
    }
  })

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(weekStart, 1))
  }

  const handleNextWeek = () => {
    onWeekChange(addWeeks(weekStart, 1))
  }

  const handleToday = () => {
    onWeekChange(new Date())
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handlePreviousWeek}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center min-w-[200px]">
            <h3 className="font-semibold text-gray-900">
              {format(weekStart, 'MMMM yyyy', { locale: fr })}
            </h3>
            <p className="text-sm text-gray-600">
              {format(weekStart, 'd MMM', { locale: fr })} - {format(weekEnd, 'd MMM', { locale: fr })}
            </p>
          </div>

          <Button
            onClick={handleNextWeek}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleToday}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Aujourd'hui
          </Button>

          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isCurrentDay = isToday(day.date)

          return (
            <Card
              key={day.key}
              className={`p-3 min-h-[200px] ${isCurrentDay ? 'ring-2 ring-purple-500' : ''}`}
            >
              {/* Day header */}
              <div className="mb-3 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {day.shortLabel}
                    </p>
                    <p className={`text-lg font-semibold ${isCurrentDay ? 'text-purple-600' : 'text-gray-900'}`}>
                      {format(day.date, 'd')}
                    </p>
                  </div>
                  {day.bookings.length > 0 && (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                      {day.bookings.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Bookings */}
              <div className="space-y-2">
                {day.bookings.length > 0 ? (
                  day.bookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => setSelectedDate(day.date)}
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Aucune réservation
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {bookings.length}
            </p>
            <p className="text-xs text-gray-600">Réservations totales</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </p>
            <p className="text-xs text-gray-600">Confirmées</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {bookings.filter((b) => b.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-600">En attente</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {bookings.filter((b) => b.status === 'in_progress').length}
            </p>
            <p className="text-xs text-gray-600">En cours</p>
          </div>
        </div>
      </Card>

      {/* Realtime indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Mises à jour en temps réel activées</span>
      </div>
    </div>
  )
}

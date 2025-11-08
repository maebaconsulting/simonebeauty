'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { mockTimeslots, mockContractors } from '@/lib/mock-data/timeslots'
import { useBookingStore } from '@/stores/useBookingStore'
import type { TimeSlot } from '@/types/booking'

export default function TimeslotPage() {
  const router = useRouter()
  const { service, address, setTimeslot, previousStep } = useBookingStore()
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Redirect if prerequisites not met
  if (!service || !address) {
    router.push('/booking/services')
    return null
  }

  // Group timeslots by date
  const slotsByDate = mockTimeslots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  const dates = Object.keys(slotsByDate).sort()

  const handleContinue = () => {
    if (selectedSlot && selectedSlot.contractor_id) {
      const contractor = mockContractors.find((c) => c.id === selectedSlot.contractor_id)
      setTimeslot(selectedSlot, contractor)
      router.push('/booking/confirmation')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain'
    } else {
      return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => {
            previousStep()
            router.back()
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre créneau
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{service.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{service.duration} min</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{address.city}</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-8">
          {dates.map((date) => {
            const daySlots = slotsByDate[date].filter((s) => s.available)

            if (daySlots.length === 0) return null

            return (
              <div key={date}>
                <h2 className="font-semibold text-lg text-gray-900 mb-4 capitalize">
                  {formatDate(date)}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {daySlots.map((slot, index) => {
                    const contractor = mockContractors.find((c) => c.id === slot.contractor_id)
                    const isSelected =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.start_time === slot.start_time

                    return (
                      <button
                        key={`${date}-${index}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-button-primary bg-button-primary/5'
                            : 'border-gray-200 hover:border-button-primary/50 bg-white'
                        }`}
                      >
                        <div className="font-semibold text-gray-900 mb-1">
                          {slot.start_time}
                        </div>
                        {contractor && (
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{contractor.first_name}</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Slot Info */}
        {selectedSlot && (
          <Card className="mt-8 border-2 border-button-primary">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Créneau sélectionné</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Date :</span>{' '}
                  <span className="font-medium">{formatDate(selectedSlot.date)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Heure :</span>{' '}
                  <span className="font-medium">{selectedSlot.start_time}</span>
                </div>
                {selectedSlot.contractor_id && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Prestataire :</span>{' '}
                    <span className="font-medium">
                      {mockContractors.find((c) => c.id === selectedSlot.contractor_id)?.first_name}{' '}
                      {mockContractors.find((c) => c.id === selectedSlot.contractor_id)?.last_name}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedSlot}
          className="w-full h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full mt-8"
        >
          Continuer vers la confirmation
        </Button>
      </div>
    </div>
  )
}

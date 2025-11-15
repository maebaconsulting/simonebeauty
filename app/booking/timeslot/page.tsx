'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBookingStore } from '@/stores/useBookingStore'
import { useBookingSession, useUpdateTimeslotSelection } from '@/hooks/useBookingSession'
import { useUser } from '@/hooks/useUser'
import { LoginGate } from '@/components/booking/LoginGate'

interface TimeSlot {
  date: string
  time: string
  available: boolean
}

function TimeslotContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { service, address, previousStep } = useBookingStore()
  const { user, isLoading: userLoading } = useUser()

  // SSR-safe sessionStorage access
  const sessionIdFromUrl = searchParams.get('sessionId')
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl)
  const { data: bookingSession, refetch: refetchSession } = useBookingSession(sessionId)

  // Load sessionStorage data on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionIdFromUrl) {
      const storedSessionId = sessionStorage.getItem('booking_session_id')
      if (storedSessionId) {
        setSessionId(storedSessionId)
      }
    }
  }, [sessionIdFromUrl])
  const updateTimeslot = useUpdateTimeslotSelection()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loginGateOpen, setLoginGateOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if this is a guest session
  const isGuestSession = bookingSession?.is_guest === true

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!service && !bookingSession?.service_id) {
      router.push('/booking/services')
    } else if (!address && !bookingSession?.address_id && !bookingSession?.guest_address) {
      router.push(`/booking/address?sessionId=${sessionId}`)
    }
  }, [service, address, bookingSession, sessionId, router])

  // Generate next 7 days
  const generateDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }

    return dates
  }

  // Generate time slots (9:00 - 18:00, every 30 minutes)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const dates = generateDates()
  const timeSlots = generateTimeSlots()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain'
    } else {
      return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    }
  }

  const handleContinue = async () => {
    if (!selectedDate || !selectedTime || !sessionId || isProcessing) {
      return
    }

    setIsProcessing(true)

    try {
      // Calculate end time based on service duration
      const duration = service?.duration || 60
      const [startHour, startMinute] = selectedTime.split(':').map(Number)
      const endDate = new Date()
      endDate.setHours(startHour, startMinute + duration)
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`

      // Update session with timeslot
      await updateTimeslot.mutateAsync({
        sessionId,
        timeslot: {
          date: selectedDate,
          start_time: selectedTime,
          end_time: endTime,
        },
      })

      console.log('✅ Timeslot saved to session')

      // Store in session storage as backup
      sessionStorage.setItem('booking_date', selectedDate)
      sessionStorage.setItem('booking_time', selectedTime)

      // Check if guest or authenticated
      if (isGuestSession) {
        // Guest user - show login gate
        console.log('🚪 Guest user detected - showing login gate')
        setLoginGateOpen(true)
      } else {
        // Authenticated user - proceed to contractor selection
        console.log('✅ Authenticated user - proceeding to contractor selection')
        router.push(`/booking/contractor?sessionId=${sessionId}`)
      }
    } catch (error) {
      console.error('❌ Error saving timeslot:', error)
      alert('Erreur lors de la sauvegarde du créneau. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAuthSuccess = async () => {
    console.log('✅ Authentication successful - refreshing session and proceeding')

    // Refetch session to get updated data
    await refetchSession()

    // Navigate to contractor selection page
    router.push(`/booking/contractor?sessionId=${sessionId}`)
  }

  if (!service && !bookingSession?.service_id) {
    return null
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
          {service && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{service.duration} min</span>
              </div>
              {address && (
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{address.city}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">Choisissez une date</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {dates.map((date) => {
              const isSelected = selectedDate === date

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-button-primary bg-button-primary/5'
                      : 'border-gray-200 hover:border-button-primary/50 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1 capitalize">
                      {formatDate(date)}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(date).getDate()}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="mb-8">
            <h2 className="font-semibold text-lg text-gray-900 mb-4">Choisissez une heure</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time

                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-button-primary bg-button-primary/5'
                        : 'border-gray-200 hover:border-button-primary/50 bg-white'
                    }`}
                  >
                    <div className="text-center font-semibold text-gray-900">
                      {time}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected Slot Info */}
        {selectedDate && selectedTime && (
          <Card className="mt-8 border-2 border-button-primary">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Créneau sélectionné</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Date :</span>{' '}
                  <span className="font-medium capitalize">{formatDate(selectedDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Heure :</span>{' '}
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime || isProcessing}
          className="w-full h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? 'Enregistrement...'
            : isGuestSession
              ? 'Continuer'
              : 'Continuer vers la confirmation'}
        </Button>

        {/* Guest helper text */}
        {isGuestSession && (
          <p className="text-sm text-gray-500 text-center mt-4">
            💡 Vous devrez créer un compte à l'étape suivante pour confirmer votre réservation
          </p>
        )}
      </div>

      {/* Login Gate Modal */}
      {sessionId && (
        <LoginGate
          open={loginGateOpen}
          onClose={() => setLoginGateOpen(false)}
          sessionId={sessionId}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}

export default function TimeslotPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <TimeslotContent />
    </Suspense>
  )
}

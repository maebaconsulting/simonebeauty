'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, User, Star, MapPin, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookingSession, useUpdateContractorSelection } from '@/hooks/useBookingSession'

interface Contractor {
  id: string
  slug: string
  business_name: string
  bio: string | null
  profile_picture_url: string | null
  specialties: string[]
  distance_km: number | null
  rating: number | null
  total_bookings: number | null
  recommendation_score: number
}

interface AssignmentResponse {
  recommended: Contractor | null
  alternatives: Contractor[]
  total_available: number
  service: {
    id: number
    name: string
    duration_minutes: number
  }
  timeslot: {
    date: string
    start_time: string
    end_time: string
  }
}

function ContractorSelectionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // SSR-safe sessionStorage access
  const sessionIdFromUrl = searchParams.get('sessionId')
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl)

  const { data: bookingSession, isLoading: sessionLoading } = useBookingSession(sessionId)
  const updateContractor = useUpdateContractorSelection()

  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null)
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get timeslot from session storage (set in timeslot page) - SSR-safe
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false) // Track if client-side hydration is complete

  // Load sessionStorage data on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSessionId = sessionStorage.getItem('booking_session_id')
      const storedDate = sessionStorage.getItem('booking_date')
      const storedTime = sessionStorage.getItem('booking_time')

      if (!sessionIdFromUrl && storedSessionId) {
        setSessionId(storedSessionId)
      }
      setSelectedDate(storedDate)
      setSelectedTime(storedTime)
      setIsHydrated(true) // Mark as hydrated after loading sessionStorage
    }
  }, [sessionIdFromUrl])

  // Redirect if prerequisites not met (only after hydration and session loading to avoid race condition)
  useEffect(() => {
    // Wait for both hydration and session loading to complete
    if (!isHydrated || sessionLoading) return

    // Also wait until we have a sessionId to check (avoid checking before sessionStorage is loaded)
    if (!sessionId) return

    // Now check if we have all required data
    if (!bookingSession || !selectedDate || !selectedTime) {
      console.log('🚨 Missing prerequisites, redirecting to services', {
        hasBookingSession: !!bookingSession,
        hasSelectedDate: !!selectedDate,
        hasSelectedTime: !!selectedTime,
        sessionId,
      })
      router.push('/booking/services')
    }
  }, [isHydrated, sessionLoading, bookingSession, selectedDate, selectedTime, sessionId, router])

  // Fetch contractor assignment
  useEffect(() => {
    if (!bookingSession || !selectedDate || !selectedTime) return

    const fetchAssignment = async () => {
      setIsLoadingAssignment(true)
      setError(null)

      try {
        const response = await fetch('/api/contractors/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: bookingSession.service_id,
            date: selectedDate,
            time: selectedTime,
            address_id: bookingSession.address_id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch contractors')
        }

        const data: AssignmentResponse = await response.json()
        setAssignment(data)

        // Auto-select recommended contractor
        if (data.recommended) {
          setSelectedContractorId(data.recommended.id)
        }
      } catch (err) {
        console.error('Error fetching contractors:', err)
        setError('Impossible de charger les prestataires disponibles')
      } finally {
        setIsLoadingAssignment(false)
      }
    }

    fetchAssignment()
  }, [bookingSession, selectedDate, selectedTime])

  const handleContinue = async () => {
    if (!sessionId || !selectedContractorId) return

    setIsSubmitting(true)

    try {
      // Update session with selected contractor
      await updateContractor.mutateAsync({
        sessionId,
        contractorId: selectedContractorId,
      })

      console.log('✅ Contractor selected:', selectedContractorId)

      // Navigate to confirmation
      router.push(`/booking/confirmation?sessionId=${sessionId}`)
    } catch (error) {
      console.error('❌ Error selecting contractor:', error)
      setError('Erreur lors de la sélection du prestataire')
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  if (sessionLoading || isLoadingAssignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-button-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Recherche des prestataires disponibles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <p className="text-lg font-semibold">Erreur</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <Button onClick={() => router.back()}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assignment || (!assignment.recommended && assignment.alternatives.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun prestataire disponible
            </h2>
            <p className="text-gray-600 mb-6">
              Malheureusement, aucun prestataire n'est disponible pour le créneau sélectionné.
            </p>
            <Button onClick={() => router.push(`/booking/timeslot?sessionId=${sessionId}`)}>
              Choisir un autre créneau
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const allContractors = assignment.recommended
    ? [assignment.recommended, ...assignment.alternatives]
    : assignment.alternatives

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre prestataire
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <strong>Service:</strong> {assignment.service.name}
            </div>
            <div>
              <strong>Date:</strong> {formatDate(assignment.timeslot.date)}
            </div>
            <div>
              <strong>Heure:</strong> {assignment.timeslot.start_time}
            </div>
          </div>
        </div>

        {/* Recommended Contractor */}
        {assignment.recommended && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Prestataire recommandé</h2>
            </div>
            <ContractorCard
              contractor={assignment.recommended}
              isSelected={selectedContractorId === assignment.recommended.id}
              isRecommended={true}
              onSelect={() => setSelectedContractorId(assignment.recommended!.id)}
            />
          </div>
        )}

        {/* Alternative Contractors */}
        {assignment.alternatives.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Autres prestataires disponibles
            </h2>
            <div className="space-y-4">
              {assignment.alternatives.map((contractor) => (
                <ContractorCard
                  key={contractor.id}
                  contractor={contractor}
                  isSelected={selectedContractorId === contractor.id}
                  isRecommended={false}
                  onSelect={() => setSelectedContractorId(contractor.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-8">
          <Button
            onClick={handleContinue}
            disabled={!selectedContractorId || isSubmitting}
            className="w-full h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Chargement...
              </span>
            ) : (
              'Continuer vers la confirmation'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Contractor Card Component
function ContractorCard({
  contractor,
  isSelected,
  isRecommended,
  onSelect,
}: {
  contractor: Contractor
  isSelected: boolean
  isRecommended: boolean
  onSelect: () => void
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'border-2 border-button-primary shadow-lg'
          : 'border-2 border-transparent hover:border-gray-300'
      } ${isRecommended ? 'bg-green-50' : 'bg-white'}`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {contractor.profile_picture_url ? (
              <img
                src={contractor.profile_picture_url}
                alt={contractor.business_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {contractor.business_name}
              </h3>
              {isSelected && (
                <CheckCircle className="w-5 h-5 text-button-primary" />
              )}
            </div>

            {contractor.bio && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{contractor.bio}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {contractor.rating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{contractor.rating.toFixed(1)}</span>
                </div>
              )}

              {contractor.total_bookings !== null && (
                <div>
                  <span className="font-medium">{contractor.total_bookings}</span> prestations
                </div>
              )}

              {contractor.distance_km !== null && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{contractor.distance_km.toFixed(1)} km</span>
                </div>
              )}
            </div>

            {contractor.specialties && contractor.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {contractor.specialties.slice(0, 3).map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white rounded-full text-xs text-gray-700 border border-gray-200"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Selection Radio */}
          <div className="flex-shrink-0">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected
                  ? 'border-button-primary bg-button-primary'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


export default function ContractorSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    }>
      <ContractorSelectionPageContent />
    </Suspense>
  )
}

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle, Tag, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookingStore } from '@/stores/useBookingStore'
import { useBookingSessionWithRelations } from '@/hooks/useBookingSession'
import { localTimeToUTC } from '@/lib/utils/timezone'
import { StripePaymentForm } from '@/components/booking/StripePaymentForm'

interface PromoCodeState {
  code: string
  discount: number
  isValid: boolean
  error: string | null
}

interface GiftCardState {
  code: string
  amount: number
  isValid: boolean
  error: string | null
  remainingBalance: number
}

function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { service, address, previousStep, reset } = useBookingStore()

  // SSR-safe sessionStorage access
  const sessionIdFromUrl = searchParams.get('sessionId')
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl)
  const { data: bookingSession, isLoading: sessionLoading } = useBookingSessionWithRelations(sessionId)

  const [showPayment, setShowPayment] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)

  // Promo and gift card state (shared with StripePaymentForm)
  const [promoState, setPromoState] = useState<PromoCodeState | null>(null)
  const [giftCardState, setGiftCardState] = useState<GiftCardState | null>(null)

  // Get timeslot from sessionStorage (SSR-safe)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

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
      setIsHydrated(true) // Mark as hydrated
    }
  }, [sessionIdFromUrl])

  // Redirect if prerequisites not met - ONLY after hydration to avoid race condition
  useEffect(() => {
    // IMPORTANT: Don't redirect if we're showing success screen
    if (isConfirmed) return

    // Wait for hydration, session loading, and sessionId to be available
    if (!isHydrated || sessionLoading || !sessionId) return

    if (!service && !bookingSession?.service_id) {
      console.log('🚨 [Confirmation] Missing service, redirecting')
      router.push('/booking/services')
    } else if (!address && !bookingSession?.address_id && !bookingSession?.guest_address) {
      console.log('🚨 [Confirmation] Missing address, redirecting')
      router.push(`/booking/address?sessionId=${sessionId}`)
    } else if (!selectedDate || !selectedTime) {
      console.log('🚨 [Confirmation] Missing timeslot, redirecting', { selectedDate, selectedTime })
      router.push(`/booking/timeslot?sessionId=${sessionId}`)
    }
  }, [isConfirmed, isHydrated, sessionLoading, service, address, selectedDate, selectedTime, bookingSession, sessionId, router])

  const handlePaymentSuccess = async (
    paymentIntentId: string,
    paymentDetails?: {
      promoCodeId?: number
      promoDiscount?: number
      giftCardId?: number
      giftCardCode?: string
      giftCardAmount?: number
    }
  ) => {
    console.log('[Confirmation] Payment successful:', paymentIntentId, paymentDetails)

    try {
      // Get service_id and address_id from session or store
      const serviceId = bookingSession?.service_id || parseInt(service?.id || '0')
      const addressId = bookingSession?.address_id || parseInt(address?.id || '0')

      if (!serviceId || !addressId) {
        throw new Error('Missing required booking information')
      }

      // Convert local Paris time to UTC for storage
      const scheduledDatetimeUTC = localTimeToUTC(selectedDate!, selectedTime!)

      // Get contractor_id from booking session
      const contractorId = bookingSession?.contractor_id

      console.log('[Confirmation] Creating booking with data:', {
        serviceId,
        addressId,
        contractorId,
        scheduledDatetimeUTC: scheduledDatetimeUTC.toISOString(),
        paymentIntentId,
        paymentDetails,
      })

      // Create the booking
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          address_id: addressId,
          scheduled_datetime: scheduledDatetimeUTC.toISOString(),
          booking_timezone: 'Europe/Paris',
          contractor_id: contractorId,
          payment_intent_id: paymentIntentId,
          // Include promo/gift card details for "no-payment-required" case
          promo_code_id: paymentDetails?.promoCodeId,
          promo_discount: paymentDetails?.promoDiscount,
          gift_card_id: paymentDetails?.giftCardId,
          gift_card_code: paymentDetails?.giftCardCode,
          gift_card_amount: paymentDetails?.giftCardAmount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const data = await response.json()
      console.log('[Confirmation] Booking created:', data)

      const newBookingId = data.booking?.id || data.booking_id || null
      setBookingId(newBookingId)
      setIsConfirmed(true)

      // Don't clean up immediately - let the success screen render first!
      // Cleanup will happen when user navigates to bookings page
    } catch (error) {
      console.error('[Confirmation] Error creating booking:', error)
      alert(
        `Erreur lors de la création de la réservation: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('[Confirmation] Payment error:', error)
    alert(`Erreur de paiement: ${error}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  // Get display data from Zustand store or booking session
  const displayService = service || bookingSession?.service

  // Debug logging
  useEffect(() => {
    console.log('[Confirmation] displayService:', displayService)
    console.log('[Confirmation] base_price:', displayService?.base_price)
    console.log('[Confirmation] service from store:', service)
    console.log('[Confirmation] service from session:', bookingSession?.service)
  }, [displayService, service, bookingSession])

  // Handle both authenticated addresses and guest addresses
  const displayAddress =
    address ||
    (bookingSession?.address
      ? {
          id: bookingSession.address.id.toString(),
          client_id: bookingSession.client_id || '',
          type: bookingSession.address.type,
          label: bookingSession.address.label,
          street: bookingSession.address.street,
          city: bookingSession.address.city,
          postal_code: bookingSession.address.postal_code,
          country: bookingSession.address.country,
          is_default: false,
          created_at: '',
        }
      : bookingSession?.guest_address
      ? {
          id: '0',
          client_id: bookingSession.client_id || '',
          type: 'guest',
          label: null,
          street: bookingSession.guest_address.street,
          city: bookingSession.guest_address.city,
          postal_code: bookingSession.guest_address.postal_code,
          country: 'FR',
          is_default: false,
          created_at: '',
        }
      : null)

  // Calculate final amount with promo and gift card discounts
  const calculateFinalAmount = () => {
    if (!displayService?.base_price) return 0
    let final = displayService.base_price
    if (promoState?.isValid) {
      final -= promoState.discount
    }
    if (giftCardState?.isValid) {
      final -= giftCardState.amount
    }
    return Math.max(0, final)
  }

  const finalAmount = calculateFinalAmount()

  // Show loading state while session is loading
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Success screen - Show immediately if confirmed (e.g., from Stripe redirect)
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-4">
              Réservation confirmée !
            </h2>
            <p className="text-gray-600 mb-2">Votre paiement a été effectué avec succès.</p>
            <p className="text-gray-600 mb-2">
              Vous recevrez une confirmation par email avec tous les détails.
            </p>

            {/* Payment Information Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 text-center">
                Informations de paiement
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>Prélèvement :</strong> Vos fonds ont été prélevés immédiatement via Stripe sécurisé
                </p>
                {displayService?.base_price && (
                  <p>
                    <strong>Montant :</strong> {((displayService.base_price || 0) / 100).toFixed(2)} €
                  </p>
                )}
                <p>
                  <strong>Annulation :</strong> Vous pouvez annuler gratuitement jusqu'à 24h avant le rendez-vous
                </p>
                <p>
                  <strong>Remboursement :</strong> En cas d'annulation dans les délais, vous serez remboursé sous 5 à 10 jours ouvrés
                </p>
              </div>
            </div>

            {bookingId && (
              <p className="text-sm text-gray-500 mt-4">Référence: #{bookingId}</p>
            )}
            <Button
              onClick={() => {
                // Clean up before navigating
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('booking_session_id')
                  sessionStorage.removeItem('booking_date')
                  sessionStorage.removeItem('booking_time')
                }
                reset()
                router.push('/client/bookings')
              }}
              className="w-full mt-6"
              size="lg"
            >
              Voir mes réservations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Validate required data before showing payment form
  if (!displayService || !displayAddress || !selectedDate || !selectedTime) {
    return null
  }

  // Calculate scheduled datetime for payment
  const scheduledDatetimeUTC = localTimeToUTC(selectedDate, selectedTime)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
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

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
            Confirmation & Paiement
          </h1>
          <p className="text-gray-600">
            Vérifiez les détails de votre réservation et procédez au paiement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            {!showPayment ? (
              <>
                {/* Booking Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Détails de la réservation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Service */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Service</p>
                      <p className="text-lg font-medium text-gray-900">
                        {displayService.name}
                      </p>
                      {('base_duration_minutes' in displayService) && displayService.base_duration_minutes && (
                        <p className="text-sm text-gray-600">
                          {displayService.base_duration_minutes} minutes
                        </p>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Date et heure</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatDate(selectedDate)} à {formatTime(selectedTime)}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Adresse</p>
                      <div className="flex items-start gap-2 text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p>{displayAddress.street}</p>
                          <p className="text-sm text-gray-600">
                            {displayAddress.postal_code} {displayAddress.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contractor */}
                    {bookingSession?.contractor && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Prestataire</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>
                            {bookingSession.contractor.first_name}{' '}
                            {bookingSession.contractor.last_name}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Confirm Button */}
                <Button
                  onClick={() => setShowPayment(true)}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  Continuer vers le paiement
                </Button>
              </>
            ) : (
              /* Payment Form */
              <StripePaymentForm
                serviceId={typeof displayService.id === 'string' ? parseInt(displayService.id) : displayService.id}
                serviceAmount={Math.round(displayService.base_price || 0)} // Already in cents
                scheduledDatetime={scheduledDatetimeUTC.toISOString()}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onPromoStateChange={setPromoState}
                onGiftCardStateChange={setGiftCardState}
              />
            )}
          </div>

          {/* Right Column: Price Summary */}
          {!showPayment && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service</span>
                    <span className="font-medium">
                      {((displayService.base_price || 0) / 100).toFixed(2)} €
                    </span>
                  </div>

                  {promoState?.isValid && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        Code promo
                      </span>
                      <span>-{(promoState.discount / 100).toFixed(2)} €</span>
                    </div>
                  )}

                  {giftCardState?.isValid && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        Carte cadeau
                      </span>
                      <span>-{(giftCardState.amount / 100).toFixed(2)} €</span>
                    </div>
                  )}

                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{(finalAmount / 100).toFixed(2)} €</span>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <p>• Paiement sécurisé par Stripe</p>
                    <p>• Vous pouvez annuler jusqu'à 24h avant</p>
                    <p>• Codes promo et cartes cadeaux acceptés</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}

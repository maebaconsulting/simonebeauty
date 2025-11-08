'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, User, Euro, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookingStore } from '@/stores/useBookingStore'
import { mockContractors } from '@/lib/mock-data/timeslots'

export default function ConfirmationPage() {
  const router = useRouter()
  const { service, address, timeslot, contractor, previousStep, reset } = useBookingStore()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Redirect if prerequisites not met
  if (!service || !address || !timeslot) {
    router.push('/booking/services')
    return null
  }

  const handleConfirm = async () => {
    setIsConfirming(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsConfirming(false)
    setIsConfirmed(true)

    // Reset booking flow after 3 seconds and redirect
    setTimeout(() => {
      reset()
      router.push('/dashboard')
    }, 3000)
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
            <p className="text-gray-600 mb-2">
              Votre demande de réservation a été envoyée au prestataire.
            </p>
            <p className="text-gray-600">
              Vous recevrez une confirmation par email dès que le prestataire aura accepté.
            </p>
            <p className="text-sm text-gray-500 mt-6">
              Redirection vers le tableau de bord...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Confirmez votre réservation
          </h1>
          <p className="text-gray-600">
            Vérifiez les détails avant de confirmer
          </p>
        </div>

        {/* Summary Cards */}
        <div className="space-y-6 mb-8">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                    {service.price}
                    <Euro className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Date et heure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-button-primary" />
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="font-medium capitalize">{formatDate(timeslot.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-button-primary" />
                  <div>
                    <div className="text-sm text-gray-600">Heure</div>
                    <div className="font-medium">{timeslot.start_time}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adresse du service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-button-primary mt-1" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">{address.label}</div>
                  <div className="text-gray-600">{address.street}</div>
                  <div className="text-gray-600">
                    {address.postal_code} {address.city}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contractor */}
          {contractor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prestataire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {contractor.avatar_url && (
                    <img
                      src={contractor.avatar_url}
                      alt={`${contractor.first_name} ${contractor.last_name}`}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-lg text-gray-900">
                      {contractor.first_name} {contractor.last_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>⭐ {contractor.rating}/5</span>
                      <span>•</span>
                      <span>{contractor.reviews_count} avis</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {contractor.specialties.join(', ')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Total Price */}
        <Card className="mb-8 border-2 border-button-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-gray-900">Total</span>
              <div className="flex items-center gap-2 text-3xl font-bold text-button-primary">
                {service.price}
                <Euro className="w-7 h-7" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Paiement après confirmation du prestataire
            </p>
          </CardContent>
        </Card>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full"
        >
          {isConfirming ? 'Confirmation en cours...' : 'Confirmer la réservation'}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          En confirmant, vous acceptez les conditions générales de vente
        </p>
      </div>
    </div>
  )
}

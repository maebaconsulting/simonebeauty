'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { mockAddresses } from '@/lib/mock-data/addresses'
import { useBookingStore } from '@/stores/useBookingStore'
import type { Address } from '@/types/booking'

export default function AddressPage() {
  const router = useRouter()
  const { service, setAddress, previousStep } = useBookingStore()
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    mockAddresses.find((a) => a.is_default) || null
  )

  // Redirect if no service selected
  if (!service) {
    router.push('/booking/services')
    return null
  }

  const handleContinue = () => {
    if (selectedAddress) {
      setAddress(selectedAddress)
      router.push('/booking/timeslot')
    }
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
            Où souhaitez-vous recevoir votre service ?
          </h1>
          <p className="text-gray-600">
            Service sélectionné : <span className="font-semibold">{service.name}</span>
          </p>
        </div>

        {/* Addresses List */}
        <div className="space-y-4 mb-8">
          {mockAddresses.map((address) => (
            <Card
              key={address.id}
              className={`cursor-pointer transition-all ${
                selectedAddress?.id === address.id
                  ? 'ring-2 ring-button-primary border-button-primary'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedAddress(address)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <MapPin className={`w-6 h-6 ${selectedAddress?.id === address.id ? 'text-button-primary' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {address.label}
                        </h3>
                        {address.is_default && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Par défaut
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{address.street}</p>
                      <p className="text-gray-600">
                        {address.postal_code} {address.city}
                      </p>
                    </div>
                  </div>
                  {selectedAddress?.id === address.id && (
                    <div className="bg-button-primary rounded-full p-1">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Address Button */}
        <Button
          variant="outline"
          className="w-full mb-8 border-2 border-dashed border-gray-300 text-gray-600 hover:border-button-primary hover:text-button-primary"
          onClick={() => alert('Fonctionnalité bientôt disponible : Ajouter une nouvelle adresse')}
        >
          + Ajouter une nouvelle adresse
        </Button>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedAddress}
          className="w-full h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full"
        >
          Continuer vers le choix du créneau
        </Button>
      </div>
    </div>
  )
}

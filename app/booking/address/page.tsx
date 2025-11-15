'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Check, ArrowLeft, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUser } from '@/hooks/useUser'
import { useClientAddresses, useDefaultAddress, useCreateAddress } from '@/hooks/useAddresses'
import { useUpdateAddressSelection, useBookingSession, useUpdateGuestAddress } from '@/hooks/useBookingSession'
import { useBookingStore } from '@/stores/useBookingStore'
import { useMarkets } from '@/hooks/useMarkets'
import { inferMarketFromCountry, formatMarketDisplay } from '@/lib/utils/market-inference'
import type { Address } from '@/types/booking'
import type { DbClientAddress } from '@/types/database'

function AddressContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: userLoading } = useUser()
  const { service, setAddress, previousStep } = useBookingStore()

  // SSR-safe sessionStorage access
  const sessionIdFromUrl = searchParams.get('sessionId')
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromUrl)

  // Load sessionStorage data on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionIdFromUrl) {
      const storedSessionId = sessionStorage.getItem('booking_session_id')
      if (storedSessionId) {
        setSessionId(storedSessionId)
      }
    }
  }, [sessionIdFromUrl])

  // Fetch addresses from database (only for authenticated users)
  const { data: addresses = [], isLoading: addressesLoading } = useClientAddresses(user?.id || '')
  const { data: defaultAddress } = useDefaultAddress(user?.id || '')

  // Fetch booking session
  const { data: bookingSession } = useBookingSession(sessionId)

  // Fetch markets for inference
  const { data: marketsData } = useMarkets({
    is_active: true,
    limit: 100,
  })
  const markets = marketsData?.data || []

  const [selectedAddress, setSelectedAddress] = useState<DbClientAddress | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    postal_code: '',
    building_info: '',
    country: 'FR',
    type: 'home' as 'home' | 'work' | 'other',
    is_default: false,
  })

  // Infer market from selected country
  const inferredMarket = inferMarketFromCountry(newAddress.country, markets)

  // Mutations
  const updateAddressSelection = useUpdateAddressSelection()
  const updateGuestAddress = useUpdateGuestAddress()
  const createAddress = useCreateAddress()

  // Check if this is a guest session
  const isGuestSession = bookingSession?.is_guest === true

  // Set default address on load (authenticated users only)
  useEffect(() => {
    if (defaultAddress && !selectedAddress && !isGuestSession) {
      setSelectedAddress(defaultAddress)
    }
  }, [defaultAddress, isGuestSession])

  // For guests, show address form by default
  // For authenticated users with no addresses, also show form by default
  useEffect(() => {
    if (isGuestSession && !userLoading) {
      setShowAddressForm(true)
    } else if (!isGuestSession && !addressesLoading && addresses.length === 0 && !showAddressForm) {
      setShowAddressForm(true)
    }
  }, [isGuestSession, userLoading, addressesLoading, addresses.length])

  // Redirect if no service selected
  useEffect(() => {
    if (!service && !bookingSession?.service_id) {
      router.push('/booking/services')
    }
  }, [service, bookingSession, router])

  // Show loading state while checking prerequisites
  if (!service && !bookingSession?.service_id) {
    return null
  }

  const convertDbAddressToAddress = (dbAddress: DbClientAddress): Address => ({
    id: dbAddress.id.toString(),
    client_id: dbAddress.client_id,
    type: dbAddress.type,
    label: dbAddress.label,
    street: dbAddress.street,
    city: dbAddress.city,
    postal_code: dbAddress.postal_code,
    country: dbAddress.country,
    is_default: dbAddress.is_default,
    latitude: dbAddress.latitude,
    longitude: dbAddress.longitude,
    created_at: dbAddress.created_at,
  })

  const handleAddAddress = async () => {
    // Validate required fields
    if (!newAddress.street || !newAddress.city || !newAddress.postal_code) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Guest flow: save address to session
    if (isGuestSession && sessionId) {
      try {
        await updateGuestAddress.mutateAsync({
          sessionId,
          address: {
            street: newAddress.street,
            city: newAddress.city,
            postal_code: newAddress.postal_code,
            building_info: newAddress.building_info || undefined,
          },
        })

        console.log('✅ Guest address saved to session')

        // Update Zustand store for UI (fake address for guest)
        const guestAddress: Address = {
          id: 'guest-temp',
          client_id: 'guest',
          type: 'home',
          street: newAddress.street,
          city: newAddress.city,
          postal_code: newAddress.postal_code,
          country: newAddress.country,
          is_default: true,
          created_at: new Date().toISOString(),
        }
        setAddress(guestAddress)

        // Navigate directly to timeslot page
        router.push(`/booking/timeslot?sessionId=${sessionId}`)
      } catch (error) {
        console.error('Error saving guest address:', error)
        alert("Erreur lors de l'enregistrement de l'adresse")
      }
      return
    }

    // Authenticated user flow: save to database
    if (!user) {
      console.error('❌ No user found for authenticated flow!')
      return
    }

    console.log('👤 User data:', { id: user.id, email: user.email })

    const addressData = {
      client_id: user.id,
      type: newAddress.type,
      label: newAddress.label || undefined,
      street: newAddress.street,
      city: newAddress.city,
      postal_code: newAddress.postal_code,
      country: newAddress.country,
      building_info: newAddress.building_info || undefined,
      is_default: newAddress.is_default,
      is_active: true,
      latitude: undefined,
      longitude: undefined,
    }

    console.log('📝 Address data to create:', addressData)

    try {
      // Create address in database
      const createdAddress = await createAddress.mutateAsync(addressData)

      // Select the newly created address
      setSelectedAddress(createdAddress)

      // Reset form and hide it
      setNewAddress({
        label: '',
        street: '',
        city: '',
        postal_code: '',
        building_info: '',
        country: 'FR',
        type: 'home',
        is_default: false,
      })
      setShowAddressForm(false)
    } catch (error) {
      console.error('Error creating address:', error)
      alert("Erreur lors de la création de l'adresse")
    }
  }

  const handleContinue = async () => {
    // For guest sessions, address is already saved via handleAddAddress
    if (isGuestSession) {
      router.push(`/booking/timeslot?sessionId=${sessionId}`)
      return
    }

    // Authenticated users: update session with selected address ID
    if (!selectedAddress || !sessionId) return

    // Update session in database
    await updateAddressSelection.mutateAsync({
      sessionId,
      addressId: selectedAddress.id,
    })

    // Update Zustand store for UI
    const address = convertDbAddressToAddress(selectedAddress)
    setAddress(address)

    router.push(`/booking/timeslot?sessionId=${sessionId}`)
  }

  // Show loading while determining user status
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    home: 'Domicile',
    work: 'Travail',
    other: 'Autre',
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
          {service && (
            <p className="text-gray-600">
              Service sélectionné : <span className="font-semibold">{service.name}</span>
            </p>
          )}
          {isGuestSession && (
            <p className="text-sm text-gray-500 mt-2">
              💡 Vous pourrez créer un compte à l'étape suivante pour sauvegarder vos informations
            </p>
          )}
        </div>

        {/* Loading State - Only for authenticated users */}
        {!isGuestSession && addressesLoading && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Chargement de vos adresses...</p>
          </div>
        )}

        {/* Addresses List - Only for authenticated users */}
        {!isGuestSession && !addressesLoading && addresses.length > 0 && (
          <div className="space-y-4 mb-8">
            {addresses.map((address) => (
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
                        <MapPin
                          className={`w-6 h-6 ${selectedAddress?.id === address.id ? 'text-button-primary' : 'text-gray-400'}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {address.label || typeLabels[address.type]}
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
        )}

        {/* Empty State - Only for authenticated users */}
        {!isGuestSession && !addressesLoading && addresses.length === 0 && (
          <div className="text-center py-8 mb-8">
            <p className="text-gray-500 text-lg mb-4">Vous n'avez pas encore d'adresse enregistrée</p>
            <p className="text-gray-400 text-sm">Ajoutez une adresse pour continuer votre réservation</p>
          </div>
        )}

        {/* Add New Address Form */}
        {showAddressForm ? (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {isGuestSession ? 'Votre adresse' : 'Nouvelle adresse'}
                </h3>
                {!isGuestSession && (
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {!isGuestSession && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (optionnel)</label>
                    <input
                      type="text"
                      placeholder="ex: Maison, Appartement..."
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-button-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 123 Rue de la Paix"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-button-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="75001"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-button-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Paris"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-button-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-button-primary"
                  >
                    {markets.map((market) => (
                      <option key={market.code} value={market.code}>
                        {market.name} ({market.code})
                      </option>
                    ))}
                  </select>
                  {inferredMarket && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Marché détecté:</span>
                      <span className="text-blue-700">{formatMarketDisplay(inferredMarket)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complément d'adresse (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Bâtiment, étage, code d'accès..."
                    value={newAddress.building_info}
                    onChange={(e) => setNewAddress({ ...newAddress, building_info: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-button-primary"
                  />
                </div>

                {!isGuestSession && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={newAddress.type}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            type: e.target.value as 'home' | 'work' | 'other',
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-button-primary"
                      >
                        <option value="home">Domicile</option>
                        <option value="work">Travail</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                        className="w-4 h-4 text-button-primary focus:ring-button-primary border-gray-300 rounded"
                      />
                      <label htmlFor="is_default" className="text-sm text-gray-700">
                        Définir comme adresse par défaut
                      </label>
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  {!isGuestSession && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleAddAddress}
                    disabled={isGuestSession ? updateGuestAddress.isPending : createAddress.isPending}
                    className={`${isGuestSession ? 'w-full' : 'flex-1'} bg-button-primary hover:bg-button-primary/90`}
                  >
                    {isGuestSession
                      ? updateGuestAddress.isPending
                        ? 'Enregistrement...'
                        : 'Continuer'
                      : createAddress.isPending
                        ? 'Ajout...'
                        : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          !isGuestSession && (
            <Button
              variant="outline"
              className="w-full mb-8 border-2 border-dashed border-gray-300 text-gray-600 hover:border-button-primary hover:text-button-primary"
              onClick={() => setShowAddressForm(true)}
            >
              + Ajouter une nouvelle adresse
            </Button>
          )
        )}

        {/* Continue Button - Only for authenticated users with selected address */}
        {!isGuestSession && selectedAddress && (
          <Button
            onClick={handleContinue}
            disabled={!selectedAddress || updateAddressSelection.isPending}
            className="w-full h-14 bg-button-primary hover:bg-button-primary/90 text-white text-lg rounded-full"
          >
            {updateAddressSelection.isPending ? 'Enregistrement...' : 'Continuer vers le choix du créneau'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function AddressPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <AddressContent />
    </Suspense>
  )
}

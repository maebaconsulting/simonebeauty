'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useServices, useServiceCategories } from '@/hooks/useServices'
import {
  useCreateBookingSession,
  useCreateGuestSession,
  useUpdateServiceSelection,
  useBookingSessionWithRelations,
} from '@/hooks/useBookingSession'
import { useMarkets } from '@/hooks/useMarkets'
import { useBookingStore } from '@/stores/useBookingStore'
import { createClient } from '@/lib/supabase/client'
import { getMarketIdFromCountry } from '@/lib/utils/market-inference'
import type { Service } from '@/types/booking'
import type { DbService, ServiceCategory } from '@/types/database'

export default function ServicesPage() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const { setService } = useBookingStore()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Fetch markets for inference
  const { data: marketsData } = useMarkets({
    is_active: true,
    limit: 100,
  })
  const markets = marketsData?.data || []

  // Fetch session with related data to extract address/market
  const { data: sessionWithRelations } = useBookingSessionWithRelations(sessionId)

  // Extract country from session address (guest or authenticated)
  const addressCountry = sessionWithRelations?.is_guest
    ? sessionWithRelations.guest_address?.country
    : sessionWithRelations?.address?.country

  // Infer market from address country
  const marketId = addressCountry ? getMarketIdFromCountry(addressCountry, markets) : null

  // Fetch services and categories from database
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories()
  const { data: services = [], isLoading: servicesLoading } = useServices({
    category: (selectedCategory as ServiceCategory) || undefined,
    market_id: marketId || undefined, // Filter by market if address exists
  })

  // Mutations
  const createAuthSession = useCreateBookingSession()
  const createGuestSession = useCreateGuestSession()
  const updateServiceSelection = useUpdateServiceSelection()

  // Initialize session on mount
  useEffect(() => {
    // Check for existing session in sessionStorage first
    const existingSessionId = sessionStorage.getItem('booking_session_id')
    if (existingSessionId) {
      setSessionId(existingSessionId)
      return
    }

    // Wait for user loading to complete
    if (userLoading) return

    // Don't create session if one already exists
    if (sessionId) return

    if (user) {
      // Create authenticated session
      console.log('🔄 Creating authenticated booking session for user:', user.id)
      createAuthSession.mutate(
        {
          session_id: crypto.randomUUID(),
          client_id: user.id,
          current_step: 1,
          source: 'catalog',
          contractor_locked: false,
          promo_discount_amount: 0,
          gift_card_amount: 0,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        {
          onSuccess: (data) => {
            console.log('✅ Authenticated session created:', data.session_id)
            setSessionId(data.session_id)
            sessionStorage.setItem('booking_session_id', data.session_id)
          },
          onError: (error) => {
            console.error('❌ Error creating authenticated session:', error)
          },
        }
      )
    } else {
      // Create guest session (no email required at this stage)
      console.log('🔄 Creating guest booking session')
      createGuestSession.mutate(
        {
          guestEmail: 'guest@temp.com', // Temporary - will be updated at login gate
          source: 'catalog',
        },
        {
          onSuccess: (data) => {
            console.log('✅ Guest session created:', data.session_id)
            setSessionId(data.session_id)
            sessionStorage.setItem('booking_session_id', data.session_id)
          },
          onError: (error) => {
            console.error('❌ Error creating guest session:', error)
          },
        }
      )
    }
  }, [user, userLoading, sessionId])

  const convertDbServiceToService = (dbService: DbService): Service => {
    // Get image URL from service_images (primary image) or fall back to legacy image_url
    let imageUrl = dbService.image_url || '/placeholder-service.jpg'

    if (dbService.service_images && dbService.service_images.length > 0) {
      // Find primary image or use first image
      const primaryImage = dbService.service_images.find(img => img.is_primary) || dbService.service_images[0]

      // Get public URL from Supabase Storage
      const supabase = createClient()
      const { data } = supabase.storage
        .from('service-images')
        .getPublicUrl(primaryImage.storage_path)

      imageUrl = data.publicUrl
    }

    return {
      id: dbService.id.toString(),
      name: dbService.name,
      description: dbService.description,
      category: dbService.category,
      duration: Number(dbService.base_duration_minutes), // Convert numeric string to number
      base_price: Number(dbService.base_price), // Convert numeric string to number (keep in cents)
      image_url: imageUrl,
      is_active: dbService.is_active,
    }
  }

  const handleSelectService = async (dbService: DbService) => {
    console.log('🎯 Service selected:', dbService.name, 'Session ID:', sessionId)

    if (!sessionId) {
      console.error('❌ No session ID available! Cannot proceed.')
      return
    }

    try {
      // Update session in database
      await updateServiceSelection.mutateAsync({
        sessionId,
        serviceId: dbService.id,
      })

      console.log('✅ Service selection updated in database')

      // Update Zustand store for UI
      const service = convertDbServiceToService(dbService)
      setService(service)

      console.log('✅ Navigating to address page...')
      router.push(`/booking/address?sessionId=${sessionId}`)
    } catch (error) {
      console.error('❌ Error updating service selection:', error)
    }
  }

  // Show loading while user state is being determined
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Find the market object for display
  const filteredMarket = marketId ? markets.find((m) => m.id === marketId) : null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nos Services
          </h1>
          <p className="text-gray-600 text-lg">
            Choisissez le service qui vous convient
          </p>

          {/* Market Filter Indicator */}
          {filteredMarket && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <Globe className="w-4 h-4" />
              <span>
                Services disponibles en <strong>{filteredMarket.name}</strong> ({filteredMarket.code})
              </span>
            </div>
          )}
        </div>

        {/* Categories */}
        {categoriesLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des catégories...</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-full transition-all ${
                selectedCategory === null
                  ? 'bg-button-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tous les services ({categories.reduce((sum, cat) => sum + cat.count, 0)})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                  selectedCategory === category.slug
                    ? 'bg-button-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-6 h-6 object-cover rounded"
                  />
                ) : (
                  category.icon && <span className="text-xl">{category.icon}</span>
                )}
                <span>{category.name} ({category.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Services Grid */}
        {servicesLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Chargement des services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              Aucun service disponible dans cette catégorie
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              // Get image URL from service_images or fall back to legacy image_url
              let imageUrl = service.image_url || '/placeholder-service.jpg'
              let altText = service.name

              if (service.service_images && service.service_images.length > 0) {
                const primaryImage = service.service_images.find(img => img.is_primary) || service.service_images[0]
                const supabase = createClient()
                const { data } = supabase.storage
                  .from('service-images')
                  .getPublicUrl(primaryImage.storage_path)
                imageUrl = data.publicUrl
                altText = primaryImage.alt_text || service.name
              }

              return (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleSelectService(service)}
              >
                <div className="relative h-48">
                  <img
                    src={imageUrl}
                    alt={altText}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-button-primary">
                      {(service.base_price / 100).toFixed(0)}€
                    </span>
                    <span className="text-sm text-gray-500">
                      {service.base_duration_minutes} min
                    </span>
                  </div>
                  <button
                    disabled={!sessionId || updateServiceSelection.isPending}
                    className="mt-4 w-full bg-button-primary hover:bg-button-primary/90 text-white py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!sessionId
                      ? 'Initialisation...'
                      : updateServiceSelection.isPending
                        ? 'Chargement...'
                        : 'Réserver'}
                  </button>
                </div>
              </div>
            )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

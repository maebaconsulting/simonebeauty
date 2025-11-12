'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ServiceCard } from '@/components/booking/ServiceCard'
import { mockServices, mockCategories } from '@/lib/mock-data/services'
import { useBookingStore } from '@/stores/useBookingStore'
import type { Service } from '@/types/booking'

export default function ServicesPage() {
  const router = useRouter()
  const setService = useBookingStore((state) => state.setService)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredServices = selectedCategory
    ? mockServices.filter((s) => s.category === selectedCategory)
    : mockServices

  const handleSelectService = (service: Service) => {
    setService(service)
    router.push('/booking/address')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nos Services
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le service qui vous convient parmi notre sélection de prestations à domicile
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedCategory === null
                ? 'bg-button-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Tous
          </button>
          {mockCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category.slug
                  ? 'bg-button-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={handleSelectService}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              Aucun service disponible dans cette catégorie
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

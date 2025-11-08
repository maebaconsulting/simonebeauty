'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Home, Building2, Search, MapPin, Edit } from 'lucide-react'

export function HeroSection() {
  const router = useRouter()
  const [serviceType, setServiceType] = useState<'home' | 'institute'>('home')
  const [location, setLocation] = useState('Cergy')

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Title */}
          <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl text-white font-bold leading-tight">
            Beauté & bien-être à domicile
            <br />
            et au bureau
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90">
            Des services professionnels directement chez vous, 7j/7.
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto">
            {/* Service Type Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setServiceType('home')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                  serviceType === 'home'
                    ? 'bg-button-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">À domicile</span>
              </button>
              <button
                onClick={() => setServiceType('institute')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                  serviceType === 'institute'
                    ? 'bg-button-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium">En institut</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Input
                type="text"
                placeholder="Rechercher une prestation..."
                className="w-full pl-4 pr-14 py-6 text-lg rounded-xl border-gray-200 focus:border-primary"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-button-primary hover:bg-button-primary/90 text-white p-3 rounded-full transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{location}</span>
              </div>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={() => router.push('/booking/services')}
              className="bg-button-primary hover:bg-button-primary/90 text-white px-8 py-6 text-lg rounded-full shadow-lg"
            >
              Réserver un service
            </Button>
            <Button
              onClick={() => router.push('/booking/services')}
              variant="outline"
              className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-white px-8 py-6 text-lg rounded-full shadow-lg"
            >
              Découvrir nos services
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 pt-8 text-white">
            <div className="text-center">
              <div className="font-playfair text-4xl md:text-5xl font-bold">7j/7</div>
              <div className="text-white/80 mt-1">Disponible</div>
            </div>
            <div className="text-center">
              <div className="font-playfair text-4xl md:text-5xl font-bold">2h</div>
              <div className="text-white/80 mt-1">Délai moyen</div>
            </div>
            <div className="text-center">
              <div className="font-playfair text-4xl md:text-5xl font-bold">100%</div>
              <div className="text-white/80 mt-1">À domicile</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

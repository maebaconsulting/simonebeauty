'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Scissors, Sparkles, Smile, Eye, Heart, Droplet } from 'lucide-react'

const categories = [
  { name: 'COIFFURE', icon: Scissors },
  { name: 'BEAUTE DE ONGLES', icon: Sparkles },
  { name: 'LE VISAGE', icon: Smile },
  { name: 'LE REGARD', icon: Eye },
  { name: 'MASSAGE BIEN-ÊTRE', icon: Heart },
  { name: 'MINCEUR & DRAINAGE', icon: Droplet },
]

const services = [
  {
    id: 1,
    title: 'COIFFURE',
    description: 'Services de coiffure professionnels directement chez vous : coupe, couleur, brushing et coiffage dans le confort de votre foyer, sans stress ni déplacement.',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
  },
  {
    id: 2,
    title: 'BEAUTE DE ONGLES',
    description: 'Soins complets des ongles à domicile : manucure, pédicure, pose de vernis et nail art pour des mains et pieds parfaits sans sortir de chez vous.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
  },
  {
    id: 3,
    title: 'LE VISAGE',
    description: 'Soins du visage personnalisés directement chez vous : nettoyage en profondeur, hydratation, anti-âge et traitements spécialisés sans quitter votre foyer.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
  },
]

export function ServicesSection() {
  const router = useRouter()

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Categories */}
        <div className="mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl text-center font-bold text-gray-900 mb-12">
            Catégories de services
          </h2>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.name}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-full hover:border-button-primary hover:text-button-primary transition-all group"
                >
                  <Icon className="w-5 h-5 group-hover:text-button-primary transition-colors" />
                  <span className="font-medium text-sm">{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Services Title */}
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nos services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Des services de beauté et bien-être professionnels directement chez vous
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card
              key={service.id}
              className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${service.image}')` }}
                />
              </div>

              {/* Content */}
              <CardContent className="p-6">
                <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6 line-clamp-3">
                  {service.description}
                </p>
                <Button
                  onClick={() => router.push('/booking/services')}
                  variant="outline"
                  className="w-full group-hover:bg-button-primary group-hover:text-white group-hover:border-button-primary transition-all"
                >
                  Réserver
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Services */}
        <div className="text-center mt-12">
          <Button
            onClick={() => router.push('/booking/services')}
            variant="outline"
            size="lg"
            className="border-2 border-button-primary text-button-primary hover:bg-button-primary hover:text-white px-8 py-6 text-lg rounded-full"
          >
            Voir tous nos services
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import { Clock, Euro } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Service } from '@/types/booking'

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={service.image_url}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Content */}
      <CardContent className="p-6">
        <h3 className="font-semibold text-xl mb-2 text-gray-900">
          {service.name}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {service.description}
        </p>

        {/* Duration & Price */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-700">
            <Clock className="w-4 h-4" />
            <span>{service.duration} min</span>
          </div>
          <div className="flex items-center gap-1 text-gray-900 font-semibold text-lg">
            <span>{(service.base_price / 100).toFixed(2)}</span>
            <Euro className="w-4 h-4" />
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onSelect(service)}
          className="w-full bg-button-primary hover:bg-button-primary/90 text-white rounded-full"
        >
          Réserver
        </Button>
      </CardContent>
    </Card>
  )
}

'use client'

/**
 * Service Detail Tabs Component
 * Feature: Service Management with Tabs
 *
 * Provides tabbed interface for service images, supplements, and contractors
 */

import { useState } from 'react'
import { Image, Package, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageGalleryManager } from '@/components/admin/ImageGalleryManager'
import { ServiceContractorsManager } from '@/components/admin/services/ServiceContractorsManager'
import { ServiceSupplementsManager } from '@/components/admin/services/ServiceSupplementsManager'

interface ServiceDetailTabsProps {
  serviceId: number
  serviceName: string
}

export function ServiceDetailTabs({ serviceId, serviceName }: ServiceDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('images')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="images" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Images
        </TabsTrigger>
        <TabsTrigger value="supplements" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Suppléments
        </TabsTrigger>
        <TabsTrigger value="contractors" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Prestataires
        </TabsTrigger>
      </TabsList>

      {/* Images Tab */}
      <TabsContent value="images">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Gestion des images</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gérez les images de ce service. La première image sera utilisée comme image principale.
            </p>
          </div>

          <ImageGalleryManager
            entityType="service"
            entityId={serviceId}
            maxImages={10}
          />
        </div>
      </TabsContent>

      {/* Supplements Tab */}
      <TabsContent value="supplements">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ServiceSupplementsManager
            serviceId={serviceId}
            serviceName={serviceName}
          />
        </div>
      </TabsContent>

      {/* Contractors Tab */}
      <TabsContent value="contractors">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ServiceContractorsManager
            serviceId={serviceId}
            serviceName={serviceName}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

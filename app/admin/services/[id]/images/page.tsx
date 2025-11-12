'use client'

/**
 * Service Images Management Page
 * Feature: 017-image-management (US0)
 *
 * Admin page for managing service images using the advanced ImageGalleryManager
 * Provides drag-and-drop reordering, set primary, edit alt-text, AI generation
 */

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ImageGalleryManager } from '@/components/admin/ImageGalleryManager'

type Service = {
  id: number
  name: string
  description: string
}

export default function ServiceImagesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const serviceId = parseInt(params.id as string, 10)

  // Check authentication
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      return data
    },
    enabled: !!session?.user?.id,
  })

  // Fetch service details
  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name, description')
        .eq('id', serviceId)
        .single()
      return data as Service
    },
    enabled: !!profile && ['admin', 'manager'].includes(profile.role) && !isNaN(serviceId),
  })

  useEffect(() => {
    if (session === undefined || profile === undefined) return

    if (!session) {
      router.push('/login')
      return
    }

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      router.push('/')
      return
    }
  }, [session, profile, router])

  if (!session || !profile || !['admin', 'manager'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (serviceLoading || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/services">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux services
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Images du service</h1>
            <p className="text-gray-600 mt-1">{service.name}</p>
            <p className="text-sm text-gray-500 mt-2">
              Gérez les images de ce service avec drag-and-drop, définissez l'image principale,
              éditez les alt-text et générez des descriptions automatiques.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImageGalleryManager
          entityType="service"
          entityId={serviceId}
          maxImages={10}
        />
      </div>
    </div>
  )
}

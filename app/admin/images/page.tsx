'use client'

/**
 * Centralized Image Management Dashboard
 * Feature: 017-image-management
 *
 * Central hub for managing all platform images
 * - Categories & Subcategories
 * - Services
 * - Statistics and overview
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Image as ImageIcon, Folder, Briefcase, TrendingUp, HardDrive } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ImagesManagementDashboard() {
  const router = useRouter()
  const supabase = createClient()

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

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['image-stats'],
    queryFn: async () => {
      // Categories with images
      const { data: categories, count: categoryCount } = await supabase
        .from('service_categories')
        .select('id', { count: 'exact' })
        .not('image_url', 'is', null)

      // Service images
      const { data: serviceImages, count: serviceImageCount } = await supabase
        .from('service_images')
        .select('file_size_bytes', { count: 'exact' })
        .is('deleted_at', null)

      // Calculate total storage used
      const totalStorageBytes = serviceImages?.reduce((sum, img) => sum + (img.file_size_bytes || 0), 0) || 0
      const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2)

      // Services with images
      const { data: servicesWithImages } = await supabase
        .from('services')
        .select(`
          id,
          name,
          service_images:service_images(count)
        `)
        .is('service_images.deleted_at', null)

      const servicesWithImagesCount = servicesWithImages?.filter(
        s => s.service_images?.[0]?.count > 0
      ).length || 0

      return {
        categoryImagesCount: categoryCount || 0,
        serviceImagesCount: serviceImageCount || 0,
        totalStorageMB,
        servicesWithImagesCount,
        totalServices: servicesWithImages?.length || 0,
      }
    },
    enabled: !!profile && ['admin', 'manager'].includes(profile.role),
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des images</h1>
            <p className="text-gray-600 mt-1">
              Gérez toutes les images de la plateforme depuis un seul endroit
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Statistics */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Folder className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.categoryImagesCount}</p>
                  <p className="text-sm text-gray-600">Images de catégories</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.serviceImagesCount}</p>
                  <p className="text-sm text-gray-600">Images de services</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.servicesWithImagesCount}/{stats.totalServices}
                  </p>
                  <p className="text-sm text-gray-600">Services avec images</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <HardDrive className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStorageMB} MB</p>
                  <p className="text-sm text-gray-600">Espace utilisé</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories & Subcategories */}
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                <Folder className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Catégories & Sous-catégories
                </h3>
                <p className="text-gray-600 mb-6">
                  Gérez les images et icônes illustrant les catégories et sous-catégories de services.
                  Chaque catégorie peut avoir une image et un emoji.
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full" />
                    <span>Upload/remplacer/supprimer images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full" />
                    <span>Choisir emoji via sélecteur visuel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full" />
                    <span>Format JPEG, PNG, WebP (max 2MB)</span>
                  </div>
                </div>
                <Link href="/admin/categories">
                  <Button className="w-full">
                    Gérer les catégories
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Services */}
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Images de services
                </h3>
                <p className="text-gray-600 mb-6">
                  Gérez jusqu'à 10 images par service avec drag-and-drop, définissez l'image principale,
                  éditez les alt-text et générez des descriptions automatiques.
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                    <span>Upload multiple images (max 10)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                    <span>Réorganisation drag-and-drop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                    <span>Édition alt-text et génération IA</span>
                  </div>
                </div>
                <Link href="/admin/services">
                  <Button className="w-full">
                    Gérer les services
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start gap-4">
            <ImageIcon className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Bonnes pratiques</h4>
              <ul className="text-sm text-gray-700 space-y-1.5">
                <li>• Utilisez des images de haute qualité pour une meilleure expérience utilisateur</li>
                <li>• Ajoutez toujours un alt-text descriptif pour l'accessibilité et le SEO</li>
                <li>• Privilégiez le format WebP pour une meilleure compression</li>
                <li>• Organisez vos images par ordre d'importance (drag-and-drop)</li>
                <li>• Définissez une image principale pour chaque service</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

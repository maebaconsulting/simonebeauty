'use client'

/**
 * Categories & Subcategories Management Page
 * Feature: 017-image-management (Category extension)
 *
 * Admin page for managing category/subcategory images and icons
 * Provides upload/delete images and emoji icon picker
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, Trash2, Image as ImageIcon, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from '@/components/admin/EmojiPicker'

type DbCategory = {
  id: number
  name: string
  slug: string
  icon: string | null
  image_url: string | null
  parent_id: number | null
  is_active: boolean
  display_order: number
}

export default function CategoriesManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [uploadingCategoryId, setUploadingCategoryId] = useState<number | null>(null)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [currentEmoji, setCurrentEmoji] = useState<string | undefined>(undefined)

  // Check authentication and role
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

  // Fetch categories with service count
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from('service_categories')
        .select(`
          *,
          services:services(count)
        `)
        .order('parent_id', { ascending: true, nullsFirst: true })
        .order('display_order', { ascending: true })

      return (categories || []) as (DbCategory & { services: { count: number }[] })[]
    },
    enabled: !!profile && ['admin', 'manager'].includes(profile.role),
  })

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ categoryId, file }: { categoryId: number; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/admin/categories/${categoryId}/upload-image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setUploadingCategoryId(null)
    },
    onError: (error: Error) => {
      console.error('Upload error:', error)
      alert(`Erreur lors de l'upload: ${error.message}`)
      setUploadingCategoryId(null)
    },
  })

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/image`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Delete failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (error: Error) => {
      console.error('Delete error:', error)
      alert(`Erreur lors de la suppression: ${error.message}`)
    },
  })

  // Update icon mutation
  const updateIconMutation = useMutation({
    mutationFn: async ({ categoryId, icon }: { categoryId: number; icon: string }) => {
      const response = await fetch(`/api/admin/categories/${categoryId}/icon`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ icon }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Icon update failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (error: Error) => {
      console.error('Icon update error:', error)
      alert(`Erreur lors de la mise à jour de l'icône: ${error.message}`)
    },
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

  const handleFileSelect = async (categoryId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez JPEG, PNG ou WebP.')
      return
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Fichier trop volumineux (max 2MB)')
      return
    }

    setUploadingCategoryId(categoryId)
    uploadImageMutation.mutate({ categoryId, file })
  }

  const handleDeleteImage = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Supprimer l'image de la catégorie "${categoryName}" ?`)) {
      return
    }

    deleteImageMutation.mutate(categoryId)
  }

  const handleOpenEmojiPicker = (categoryId: number, currentIcon: string | null) => {
    setEditingCategoryId(categoryId)
    setCurrentEmoji(currentIcon || undefined)
    setEmojiPickerOpen(true)
  }

  const handleEmojiSelect = (emoji: string) => {
    if (editingCategoryId) {
      updateIconMutation.mutate({ categoryId: editingCategoryId, icon: emoji })
    }
  }

  if (!session || !profile || !['admin', 'manager'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  // Separate main categories and subcategories
  const mainCategories = categoriesData?.filter(cat => !cat.parent_id) || []
  const subcategoriesMap = new Map<number, typeof categoriesData>()
  categoriesData?.forEach(cat => {
    if (cat.parent_id) {
      if (!subcategoriesMap.has(cat.parent_id)) {
        subcategoriesMap.set(cat.parent_id, [])
      }
      subcategoriesMap.get(cat.parent_id)!.push(cat)
    }
  })

  // Calculate total services
  const totalServices = mainCategories.reduce((sum, cat) => {
    const serviceCount = cat.services?.[0]?.count || 0
    const subcats = subcategoriesMap.get(cat.id) || []
    const subcatCount = subcats.reduce((subSum, subcat) => subSum + (subcat.services?.[0]?.count || 0), 0)
    return sum + serviceCount + subcatCount
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des catégories et sous-catégories</h1>
            <p className="text-gray-600 mt-1">
              Gérez les images et icônes des catégories de services
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {mainCategories.length} catégories • {totalServices} services au total
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {mainCategories.map((category) => {
          const subcategories = subcategoriesMap.get(category.id) || []
          const serviceCount = category.services?.[0]?.count || 0

          return (
            <div key={category.id} className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              {/* Main Category Header */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleOpenEmojiPicker(category.id, category.icon)}
                      className="relative group"
                      title="Changer l'icône"
                    >
                      <span className="text-4xl block transition-transform group-hover:scale-110">
                        {category.icon || '📁'}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Smile className="h-5 w-5 text-white" />
                      </div>
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {category.slug} • {serviceCount} service{serviceCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-20 h-20 object-cover rounded-lg shadow-sm border border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleFileSelect(category.id, e)}
                          className="hidden"
                          disabled={uploadingCategoryId === category.id}
                        />
                        <Button
                          size="sm"
                          disabled={uploadingCategoryId === category.id}
                          asChild
                        >
                          <span>
                            {uploadingCategoryId === category.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {category.image_url ? 'Remplacer' : 'Ajouter'}
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      {category.image_url && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(category.id, category.name)}
                          disabled={deleteImageMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              {subcategories.length > 0 && (
                <div className="divide-y divide-gray-100 bg-white">
                  {subcategories.map((subcat) => {
                    const subcatServiceCount = subcat.services?.[0]?.count || 0

                    return (
                      <div key={subcat.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-1 h-12 bg-purple-200 rounded mr-4" />
                          <button
                            onClick={() => handleOpenEmojiPicker(subcat.id, subcat.icon)}
                            className="relative group"
                            title="Changer l'icône"
                          >
                            <span className="text-3xl block transition-transform group-hover:scale-110">
                              {subcat.icon || '📄'}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <Smile className="h-4 w-4 text-white" />
                            </div>
                          </button>
                          <div>
                            <p className="font-semibold text-gray-900">{subcat.name}</p>
                            <p className="text-sm text-gray-500">
                              {subcat.slug} • {subcatServiceCount} service{subcatServiceCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {subcat.image_url ? (
                            <img
                              src={subcat.image_url}
                              alt={subcat.name}
                              className="w-14 h-14 object-cover rounded shadow-sm border border-gray-200"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                              <ImageIcon className="w-7 h-7 text-gray-400" />
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => handleFileSelect(subcat.id, e)}
                                className="hidden"
                                disabled={uploadingCategoryId === subcat.id}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={uploadingCategoryId === subcat.id}
                                asChild
                              >
                                <span>
                                  {uploadingCategoryId === subcat.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Upload...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      {subcat.image_url ? 'Remplacer' : 'Ajouter'}
                                    </>
                                  )}
                                </span>
                              </Button>
                            </label>
                            {subcat.image_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteImage(subcat.id, subcat.name)}
                                disabled={deleteImageMutation.isPending}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Emoji Picker Modal */}
      {emojiPickerOpen && (
        <EmojiPicker
          currentEmoji={currentEmoji}
          onSelect={handleEmojiSelect}
          onClose={() => {
            setEmojiPickerOpen(false)
            setEditingCategoryId(null)
            setCurrentEmoji(undefined)
          }}
        />
      )}
    </div>
  )
}

'use client'

/**
 * Categories Tab Component
 * Feature: 018-service-management-crud
 *
 * Category, subcategory and tags selection
 * Fields: category_id, subcategory_id, tags
 */

import { UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { AlertCircle, Folder, Tag, X } from 'lucide-react'
import { ServiceInsertData } from '@/lib/validations/service-schemas'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ============================================================================
// Types
// ============================================================================

interface CategoriesTabProps {
  form: UseFormReturn<ServiceInsertData>
}

interface ServiceCategory {
  id: number
  name: string
  slug: string
  parent_id: number | null
  icon: string | null
}

// ============================================================================
// Component
// ============================================================================

export default function CategoriesTab({ form }: CategoriesTabProps) {
  const {
    formState: { errors },
    watch,
    setValue,
  } = form

  const supabase = createClient()
  const [newTag, setNewTag] = useState('')

  const category_id = watch('category_id')
  const subcategory_id = watch('subcategory_id')
  const tags = watch('tags') || []

  // Fetch all categories
  const { data: allCategories, isLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data as ServiceCategory[]
    },
  })

  // Separate main categories and subcategories
  const mainCategories = allCategories?.filter(cat => cat.parent_id === null) || []
  const subcategories = allCategories?.filter(cat => cat.parent_id === category_id) || []

  // Handle tag addition
  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setValue('tags', [...tags, trimmedTag], { shouldValidate: true })
      setNewTag('')
    }
  }

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(t => t !== tagToRemove), { shouldValidate: true })
  }

  // Handle Enter key for tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Catégories et tags
        </h2>
        <p className="text-gray-600">
          Classez votre service pour faciliter sa découverte
        </p>
      </div>

      {/* Main Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="category_id" className="required">
          Catégorie principale
        </Label>
        {isLoading ? (
          <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mainCategories.map((category) => {
              const isSelected = category_id === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setValue('category_id', category.id, { shouldValidate: true })
                    // Reset subcategory when changing main category
                    setValue('subcategory_id', undefined)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{category.slug}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
        {errors.category_id && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.category_id.message}
          </p>
        )}
      </div>

      {/* Subcategory Selection */}
      {category_id && subcategories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subcategory_id">
            Sous-catégorie
            <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {subcategories.map((subcategory) => {
              const isSelected = subcategory_id === subcategory.id
              return (
                <button
                  key={subcategory.id}
                  type="button"
                  onClick={() => {
                    setValue(
                      'subcategory_id',
                      isSelected ? undefined : subcategory.id,
                      { shouldValidate: true }
                    )
                  }}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-purple-300 bg-white text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium truncate">{subcategory.name}</span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tags Section */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <Label htmlFor="tags">
            Tags
            <span className="ml-2 text-xs text-gray-500">(optionnel)</span>
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            Ajoutez des mots-clés pour améliorer la recherche et le filtrage
          </p>
        </div>

        {/* Tag Input */}
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Ex: relaxant, anti-stress, detox..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            variant="outline"
          >
            <Tag className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Tags List */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-900 rounded-full text-sm"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="font-medium">{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tags.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Aucun tag ajouté
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Les tags aident les clients à trouver votre service
            </p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Tag className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Suggestions de tags populaires</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['relaxant', 'bien-être', 'détente', 'anti-stress', 'soulagement', 'revitalisant'].map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    if (!tags.includes(suggestion)) {
                      setValue('tags', [...tags, suggestion], { shouldValidate: true })
                    }
                  }}
                  disabled={tags.includes(suggestion)}
                  className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-900 rounded text-xs border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

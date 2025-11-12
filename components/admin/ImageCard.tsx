'use client'

/**
 * Image Card Component
 * Feature: 017-image-management
 * SpecKit: US0 - Admin Image Management for Services
 *
 * Displays a single image with:
 * - Image preview with optimized loading
 * - Primary badge indicator
 * - Actions: Delete, Set Primary, Edit Alt-Text
 * - Drag handle for reordering
 */

import { useState } from 'react'
import { Trash2, Star, Edit3, GripVertical, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DbServiceImageWithRelations } from '@/types/database'

interface ImageCardProps {
  image: DbServiceImageWithRelations
  onDelete?: (imageId: number) => void
  onSetPrimary?: (imageId: number) => void
  onEditAltText?: (imageId: number, currentAltText: string) => void
  onGenerateAltText?: (imageId: number) => void
  isDragging?: boolean
  dragHandleProps?: any
  isGeneratingAltText?: boolean
}

export function ImageCard({
  image,
  onDelete,
  onSetPrimary,
  onEditAltText,
  onGenerateAltText,
  isDragging = false,
  dragHandleProps,
  isGeneratingAltText = false
}: ImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      onDelete?.(image.id)
    }
  }

  const handleSetPrimary = () => {
    if (!image.is_primary) {
      onSetPrimary?.(image.id)
    }
  }

  const handleEditAltText = () => {
    onEditAltText?.(image.id, image.alt_text)
  }

  const handleGenerateAltText = () => {
    onGenerateAltText?.(image.id)
  }

  return (
    <div
      className={`
        group relative bg-white border-2 rounded-lg overflow-hidden
        transition-all duration-200
        ${isDragging ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'}
        ${image.is_primary ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
      {/* Drag Handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 left-2 z-10 p-1.5 bg-white/90 rounded cursor-move hover:bg-white transition-colors"
        >
          <GripVertical className="h-5 w-5 text-gray-600" />
        </div>
      )}

      {/* Primary Badge */}
      {image.is_primary && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
          <Star className="h-3 w-3 fill-current" />
          Principal
        </div>
      )}

      {/* Image Preview */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
              </div>
            )}
            <img
              src={image.public_url || `/api/images/serve?path=${encodeURIComponent(image.storage_path)}`}
              alt={image.alt_text}
              className={`
                w-full h-full object-cover transition-opacity duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-red-600">
            <div className="text-center">
              <div className="text-sm font-medium">Erreur de chargement</div>
              <div className="text-xs mt-1 text-gray-500">Image non disponible</div>
            </div>
          </div>
        )}

        {/* Hover Overlay with Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            {/* Action Buttons */}
            <div className="flex gap-2">
              {!image.is_primary && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSetPrimary}
                  className="bg-white/90 hover:bg-white"
                  title="Définir comme image principale"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={handleEditAltText}
                className="bg-white/90 hover:bg-white"
                title="Modifier le texte alternatif"
              >
                <Edit3 className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleGenerateAltText}
                disabled={isGeneratingAltText}
                className="bg-white/90 hover:bg-white"
                title="Générer l'alt-text avec IA"
              >
                <Sparkles className={`h-4 w-4 ${isGeneratingAltText ? 'animate-pulse' : ''}`} />
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                title="Supprimer l'image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Info */}
      <div className="p-3 space-y-2">
        {/* Alt Text */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Texte alternatif :</p>
          <p className="text-sm text-gray-900 line-clamp-2" title={image.alt_text}>
            {image.alt_text}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            {image.width && image.height ? (
              <span>{image.width} × {image.height}px</span>
            ) : (
              <span>Dimensions inconnues</span>
            )}
          </div>
          <div>
            {(image.file_size_bytes / 1024).toFixed(0)} KB
          </div>
        </div>

        {/* Display Order (for debugging) */}
        <div className="text-xs text-gray-400">
          Ordre: {image.display_order}
        </div>
      </div>
    </div>
  )
}

'use client'

/**
 * Image Gallery Manager Component
 * Feature: 017-image-management
 * SpecKit: US0 - Admin Image Management for Services
 *
 * Main orchestrator component for image management:
 * - Fetches and displays images for an entity (service/product)
 * - Drag-and-drop reordering with @dnd-kit
 * - Upload new images with ImageDropzone
 * - Edit, delete, set primary actions via ImageCard
 * - Alt-text editing modal via AltTextEditor
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ImageDropzone } from './ImageDropzone'
import { ImageCard } from './ImageCard'
import { AltTextEditor } from './AltTextEditor'
import { useImageReorder } from '@/hooks/useImageReorder'
import type { EntityType } from '@/lib/validations/image-schemas'
import type { DbServiceImageWithRelations } from '@/types/database'

interface ImageGalleryManagerProps {
  entityType: EntityType
  entityId: number
  maxImages?: number
}

// Wrapper component for sortable ImageCard
function SortableImageCard({
  image,
  onDelete,
  onSetPrimary,
  onEditAltText,
  onGenerateAltText,
  isGeneratingAltText
}: {
  image: DbServiceImageWithRelations
  onDelete: (imageId: number) => void
  onSetPrimary: (imageId: number) => void
  onEditAltText: (imageId: number, currentAltText: string) => void
  onGenerateAltText: (imageId: number) => void
  isGeneratingAltText: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ImageCard
        image={image}
        onDelete={onDelete}
        onSetPrimary={onSetPrimary}
        onEditAltText={onEditAltText}
        onGenerateAltText={onGenerateAltText}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        isGeneratingAltText={isGeneratingAltText}
      />
    </div>
  )
}

export function ImageGalleryManager({
  entityType,
  entityId,
  maxImages = 10
}: ImageGalleryManagerProps) {
  const [images, setImages] = useState<DbServiceImageWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Alt-text editor state
  const [altTextEditorOpen, setAltTextEditorOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<{ id: number; altText: string; previewUrl?: string } | null>(null)
  const [generatingAltTextImageId, setGeneratingAltTextImageId] = useState<number | null>(null)

  const supabase = createClient()
  const { reorder } = useImageReorder()

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch images on mount and when entity changes
  useEffect(() => {
    fetchImages()
  }, [entityId, entityType])

  const fetchImages = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const tableName = getTableNameForEntityType(entityType)
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(getEntityIdColumnName(entityType), entityId)
        .is('deleted_at', null)
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError

      // Add public URLs
      const imagesWithUrls = (data || []).map((img: any) => ({
        ...img,
        public_url: getPublicUrl(img.storage_path)
      })) as DbServiceImageWithRelations[]

      setImages(imagesWithUrls)
    } catch (err: any) {
      console.error('Error fetching images:', err)
      setError(err.message || 'Erreur lors du chargement des images')
    } finally {
      setIsLoading(false)
    }
  }

  const getPublicUrl = (storagePath: string): string => {
    const bucket = getBucketForEntityType(entityType)
    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
    return data.publicUrl
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Optimistically update UI
    const newOrder = arrayMove(images, oldIndex, newIndex)
    setImages(newOrder)

    // Send reorder request to API
    try {
      const result = await reorder({
        entityType,
        entityId,
        imageOrder: newOrder.map(img => img.id)
      })

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors du réordonnancement')
      }
    } catch (err: any) {
      console.error('Reorder error:', err)
      // Revert on error
      fetchImages()
      setError(err.message)
    }
  }

  const handleDelete = async (imageId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      const response = await fetch(
        `/api/images/delete?imageId=${imageId}&entityType=${entityType}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression')
      }

      // Remove from state
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message)
    }
  }

  const handleSetPrimary = async (imageId: number) => {
    try {
      const tableName = getTableNameForEntityType(entityType)

      // Unset current primary
      await supabase
        .from(tableName)
        .update({ is_primary: false })
        .eq(getEntityIdColumnName(entityType), entityId)
        .eq('is_primary', true)

      // Set new primary
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ is_primary: true })
        .eq('id', imageId)

      if (updateError) throw updateError

      // Update local state
      setImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })))
    } catch (err: any) {
      console.error('Set primary error:', err)
      setError(err.message)
    }
  }

  const handleEditAltText = (imageId: number, currentAltText: string) => {
    const image = images.find(img => img.id === imageId)
    setEditingImage({
      id: imageId,
      altText: currentAltText,
      previewUrl: image?.public_url
    })
    setAltTextEditorOpen(true)
  }

  const handleSaveAltText = async (imageId: number, newAltText: string) => {
    try {
      const tableName = getTableNameForEntityType(entityType)
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ alt_text: newAltText })
        .eq('id', imageId)

      if (updateError) throw updateError

      // Update local state
      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, alt_text: newAltText } : img
      ))
    } catch (err: any) {
      console.error('Update alt-text error:', err)
      setError(err.message)
    }
  }

  const handleGenerateAltText = (imageId: number) => {
    setGeneratingAltTextImageId(imageId)
    const image = images.find(img => img.id === imageId)
    if (image) {
      setEditingImage({
        id: imageId,
        altText: image.alt_text,
        previewUrl: image.public_url
      })
      setAltTextEditorOpen(true)
    }
  }

  const handleUploadComplete = (uploadedImages: any[]) => {
    // Refresh images list
    fetchImages()
    setUploadError(null)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {(error || uploadError) && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Erreur</p>
            <p className="mt-1">{error || uploadError}</p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <ImageDropzone
        entityType={entityType}
        entityId={entityId}
        maxImages={maxImages}
        currentImageCount={images.length}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />

      {/* Images Grid with Drag-and-Drop */}
      {images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Images ({images.length}/{maxImages})
          </h3>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map(img => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((image) => (
                  <SortableImageCard
                    key={image.id}
                    image={image}
                    onDelete={handleDelete}
                    onSetPrimary={handleSetPrimary}
                    onEditAltText={handleEditAltText}
                    onGenerateAltText={handleGenerateAltText}
                    isGeneratingAltText={generatingAltTextImageId === image.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucune image pour le moment</p>
          <p className="text-sm mt-1">Utilisez la zone ci-dessus pour uploader des images</p>
        </div>
      )}

      {/* Alt-Text Editor Modal */}
      {editingImage && (
        <AltTextEditor
          isOpen={altTextEditorOpen}
          onClose={() => {
            setAltTextEditorOpen(false)
            setEditingImage(null)
            setGeneratingAltTextImageId(null)
          }}
          imageId={editingImage.id}
          entityType={entityType}
          currentAltText={editingImage.altText}
          imagePreviewUrl={editingImage.previewUrl}
          onSave={handleSaveAltText}
        />
      )}
    </div>
  )
}

// Helper functions
function getTableNameForEntityType(entityType: EntityType): string {
  const tableMap: Record<EntityType, string> = {
    service: 'service_images',
    product: 'product_images',
    product_variant: 'product_images',
    conversation: 'conversation_attachments'
  }
  return tableMap[entityType]
}

function getEntityIdColumnName(entityType: EntityType): string {
  const columnMap: Record<EntityType, string> = {
    service: 'service_id',
    product: 'product_id',
    product_variant: 'variant_id',
    conversation: 'conversation_id'
  }
  return columnMap[entityType]
}

function getBucketForEntityType(entityType: EntityType): string {
  const bucketMap: Record<EntityType, string> = {
    service: 'service-images',
    product: 'product-images',
    product_variant: 'product-images',
    conversation: 'conversation-attachments'
  }
  return bucketMap[entityType]
}

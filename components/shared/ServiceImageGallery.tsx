'use client'

/**
 * Service Image Gallery Component
 * Feature: 017-image-management
 * SpecKit: US1 - Client Display with Gallery & Lightbox
 *
 * Full-featured image gallery with:
 * - Thumbnail navigation
 * - Lightbox/modal view
 * - Keyboard navigation (arrow keys, ESC)
 * - Touch/swipe support (future enhancement)
 * - Optimized loading with OptimizedImage
 */

import { useState, useEffect, useCallback } from 'react'
import { OptimizedImage } from './OptimizedImage'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ServiceImage {
  id: number
  storage_path: string
  public_url?: string
  alt_text: string
  is_primary: boolean
  display_order: number
}

interface ServiceImageGalleryProps {
  images: ServiceImage[]
  initialImageIndex?: number
  className?: string
}

export function ServiceImageGallery({
  images,
  initialImageIndex = 0,
  className = ''
}: ServiceImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Sort images by display_order, put primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return a.display_order - b.display_order
  })

  const currentImage = sortedImages[currentIndex]

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const handleImageClick = () => {
    setLightboxIndex(currentIndex)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  const nextImage = useCallback(() => {
    if (isLightboxOpen) {
      setLightboxIndex((prev) => (prev + 1) % sortedImages.length)
    } else {
      setCurrentIndex((prev) => (prev + 1) % sortedImages.length)
    }
  }, [isLightboxOpen, sortedImages.length])

  const previousImage = useCallback(() => {
    if (isLightboxOpen) {
      setLightboxIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
    } else {
      setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
    }
  }, [isLightboxOpen, sortedImages.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        closeLightbox()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      } else if (e.key === 'ArrowLeft') {
        previousImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, nextImage, previousImage])

  // Handle empty images
  if (!sortedImages || sortedImages.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-12 text-center ${className}`}>
        <p className="text-gray-500">Aucune image disponible</p>
      </div>
    )
  }

  return (
    <>
      {/* Main Gallery */}
      <div className={className}>
        {/* Main Image Display */}
        <div
          className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
          onClick={handleImageClick}
        >
          <OptimizedImage
            src={currentImage.public_url || `/api/images/serve?path=${encodeURIComponent(currentImage.storage_path)}`}
            alt={currentImage.alt_text}
            priority={currentIndex === 0}
            objectFit="contain"
            className="w-full h-full"
          />

          {/* Overlay hint on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 px-4 py-2 rounded-full text-sm font-medium">
              Cliquez pour agrandir
            </div>
          </div>

          {/* Navigation arrows (only if multiple images) */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  previousImage()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {sortedImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails (only if more than 1 image) */}
        {sortedImages.length > 1 && (
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => handleThumbnailClick(index)}
                className={`
                  relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                  ${index === currentIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <OptimizedImage
                  src={image.public_url || `/api/images/serve?path=${encodeURIComponent(image.storage_path)}`}
                  alt={image.alt_text}
                  objectFit="cover"
                  className="w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full text-sm z-10">
            {lightboxIndex + 1} / {sortedImages.length}
          </div>

          {/* Main lightbox image */}
          <div className="relative w-full h-full p-12 flex items-center justify-center">
            <OptimizedImage
              src={sortedImages[lightboxIndex].public_url || `/api/images/serve?path=${encodeURIComponent(sortedImages[lightboxIndex].storage_path)}`}
              alt={sortedImages[lightboxIndex].alt_text}
              priority
              objectFit="contain"
              className="max-w-full max-h-full"
            />
          </div>

          {/* Alt text display */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-2xl text-center text-white/80 text-sm px-4">
            {sortedImages[lightboxIndex].alt_text}
          </div>
        </div>
      )}
    </>
  )
}

'use client'

/**
 * Optimized Image Component (Feature 017)
 *
 * Progressive image loading with:
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder while loading
 * - Responsive srcset (future enhancement with image CDN)
 * - Error fallback
 * - Accessibility with alt-text
 *
 * Works with Supabase Storage images from service_images/product_images tables
 */

import { useState, useEffect, useRef } from 'react'
import { ImageOff } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean // Skip lazy loading for above-the-fold images
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  objectFit = 'cover',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // If priority, load immediately
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (priority || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
      }
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Determine aspect ratio for container
  const aspectRatio = width && height ? (height / width) * 100 : undefined

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined,
        width: width ? `${width}px` : '100%',
        height: !aspectRatio && height ? `${height}px` : aspectRatio ? 0 : '100%'
      }}
    >
      {hasError ? (
        // Error state
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-100">
          <ImageOff className="h-12 w-12 mb-2" />
          <p className="text-sm">Image non disponible</p>
        </div>
      ) : (
        <>
          {/* Blur placeholder while loading */}
          {!isLoaded && isInView && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
          )}

          {/* Actual image - only load when in view or priority */}
          {isInView && (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              loading={priority ? 'eager' : 'lazy'}
              className={`
                absolute inset-0 w-full h-full transition-opacity duration-300
                ${isLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              style={{
                objectFit
              }}
              onLoad={handleLoad}
              onError={handleError}
              draggable={false}
            />
          )}

          {/* Skeleton loader before image enters viewport */}
          {!isInView && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
          )}
        </>
      )}
    </div>
  )
}

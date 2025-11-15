/**
 * useImageUpload Hook
 * Feature: 017-image-management
 *
 * Hook for uploading images with progress tracking and validation
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EntityType } from '@/lib/validations/image-schemas'
import { validateImageFile } from '@/lib/validations/image-schemas'

export interface ImageUploadOptions {
  file: File
  entityType: EntityType
  entityId: number
  altText?: string
  isPrimary?: boolean
}

export interface ImageUploadResult {
  success: boolean
  data?: {
    id: number
    storagePath: string
    publicUrl: string
    altText: string
    fileSizeBytes: number
    width: number | null
    height: number | null
    displayOrder: number
    isPrimary: boolean
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const upload = async (options: ImageUploadOptions): Promise<ImageUploadResult> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Validate file
      const validation = validateImageFile(options.file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', options.file)
      formData.append('entityType', options.entityType)
      formData.append('entityId', options.entityId.toString())
      if (options.altText) {
        formData.append('altText', options.altText)
      }
      formData.append('isPrimary', (options.isPrimary || false).toString())

      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Non authentifié')
      }

      // Upload with XMLHttpRequest to track progress
      const result = await new Promise<ImageUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100)
            setProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (error) {
              reject(new Error('Erreur de parsing de la réponse'))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              reject(new Error(errorResponse.error?.message || 'Erreur d\'upload'))
            } catch {
              reject(new Error(`Erreur HTTP ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Erreur réseau'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload annulé'))
        })

        xhr.open('POST', '/api/images/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.send(formData)
      })

      setProgress(100)
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'upload'
      setError(errorMessage)
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: errorMessage
        }
      }
    } finally {
      setIsUploading(false)
    }
  }

  const reset = () => {
    setIsUploading(false)
    setProgress(0)
    setError(null)
  }

  return {
    upload,
    isUploading,
    progress,
    error,
    reset
  }
}

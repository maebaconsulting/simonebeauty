/**
 * useImageReorder Hook
 * Feature: 017-image-management
 *
 * Hook for reordering images with drag-and-drop support
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EntityType } from '@/lib/validations/image-schemas'

export interface ImageReorderOptions {
  entityType: EntityType
  entityId: number
  imageOrder: number[] // Array of image IDs in desired order
}

export interface ImageReorderResult {
  success: boolean
  data?: {
    updated: number
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

export function useImageReorder() {
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const reorder = async (options: ImageReorderOptions): Promise<ImageReorderResult> => {
    setIsReordering(true)
    setError(null)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Non authentifié')
      }

      // Call reorder API
      const response = await fetch('/api/images/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          entityType: options.entityType,
          entityId: options.entityId,
          imageOrder: options.imageOrder
        })
      })

      const result: ImageReorderResult = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors du réordonnancement')
      }

      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du réordonnancement'
      setError(errorMessage)
      return {
        success: false,
        error: {
          code: 'REORDER_ERROR',
          message: errorMessage
        }
      }
    } finally {
      setIsReordering(false)
    }
  }

  const reset = () => {
    setIsReordering(false)
    setError(null)
  }

  return {
    reorder,
    isReordering,
    error,
    reset
  }
}

/**
 * useAltTextGeneration Hook
 * Feature: 017-image-management
 *
 * Hook for generating AI-powered alt-text for images
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EntityType } from '@/lib/validations/image-schemas'

export interface GenerateAltTextOptions {
  imageId: number
  entityType: EntityType
  saveToDatabase?: boolean
  maxLength?: number
}

export interface GenerateAltTextResult {
  success: boolean
  data?: {
    imageId: number
    altText: string
    generatedBy: string // 'gpt-4-vision-preview' or 'fallback'
    saved: boolean
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

export function useAltTextGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGeneratedText, setLastGeneratedText] = useState<string | null>(null)
  const supabase = createClient()

  const generate = async (options: GenerateAltTextOptions): Promise<GenerateAltTextResult> => {
    setIsGenerating(true)
    setError(null)
    setLastGeneratedText(null)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Non authentifié')
      }

      // Call generate-alt-text API
      const params = new URLSearchParams({
        imageId: options.imageId.toString(),
        entityType: options.entityType,
        saveToDatabase: (options.saveToDatabase ?? true).toString()
      })

      if (options.maxLength) {
        params.append('maxLength', options.maxLength.toString())
      }

      const response = await fetch(`/api/images/generate-alt-text?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result: GenerateAltTextResult = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la génération')
      }

      // Store last generated text
      if (result.data?.altText) {
        setLastGeneratedText(result.data.altText)
      }

      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la génération de l\'alt-text'
      setError(errorMessage)
      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: errorMessage
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Generate alt-text for multiple images in batch
   * @param images Array of images to generate alt-text for
   * @param concurrency Max number of concurrent requests (default: 3)
   */
  const generateBatch = async (
    images: GenerateAltTextOptions[],
    concurrency: number = 3
  ): Promise<GenerateAltTextResult[]> => {
    const results: GenerateAltTextResult[] = []

    // Process in batches to avoid rate limits
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency)
      const batchResults = await Promise.all(
        batch.map((img) => generate(img))
      )
      results.push(...batchResults)

      // Add delay between batches to respect OpenAI rate limits
      if (i + concurrency < images.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  const reset = () => {
    setIsGenerating(false)
    setError(null)
    setLastGeneratedText(null)
  }

  return {
    generate,
    generateBatch,
    isGenerating,
    error,
    lastGeneratedText,
    reset
  }
}

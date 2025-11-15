/**
 * usePromoValidation Hook
 * Feature: 015-promo-codes-system
 *
 * React Query hook for validating promo codes
 */

'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { validatePromoCode } from '@/lib/supabase/queries/promo-codes'
import type { ValidatePromoParams, PromoValidationResult, AppliedPromo } from '@/types/promo-validation'

// Rate limiting: max 5 validations per minute
const MAX_VALIDATIONS_PER_MINUTE = 5
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in ms

interface UsePromoValidationOptions {
  onSuccess?: (result: PromoValidationResult) => void
  onError?: (error: Error) => void
}

export function usePromoValidation(options: UsePromoValidationOptions = {}) {
  const [validationAttempts, setValidationAttempts] = useState<number[]>([])
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)

  /**
   * Check if rate limit is exceeded
   */
  const isRateLimited = useCallback(() => {
    const now = Date.now()
    const recentAttempts = validationAttempts.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    )

    if (recentAttempts.length >= MAX_VALIDATIONS_PER_MINUTE) {
      return true
    }

    // Clean up old attempts
    setValidationAttempts(recentAttempts)
    return false
  }, [validationAttempts])

  /**
   * Track validation attempt
   */
  const trackAttempt = useCallback(() => {
    setValidationAttempts((prev) => [...prev, Date.now()])
  }, [])

  /**
   * Validation mutation
   */
  const validationMutation = useMutation({
    mutationFn: async (params: ValidatePromoParams) => {
      // Check rate limit
      if (isRateLimited()) {
        throw new Error('rate_limit_exceeded')
      }

      // Track this attempt
      trackAttempt()

      // Call validation RPC
      const result = await validatePromoCode(params)

      // If valid, update applied promo
      if (result.valid && result.promo_code_id) {
        setAppliedPromo({
          promo_code_id: result.promo_code_id,
          code: params.code,
          discount_type: result.discount_type!,
          discount_value: result.discount_value!,
          discount_amount: result.discount_amount!,
          final_amount: result.final_amount!,
        })
      }

      return result
    },
    onSuccess: (result) => {
      if (options.onSuccess) {
        options.onSuccess(result)
      }
    },
    onError: (error: Error) => {
      if (options.onError) {
        options.onError(error)
      }
    },
  })

  /**
   * Remove applied promo
   */
  const removePromo = useCallback(() => {
    setAppliedPromo(null)
  }, [])

  /**
   * Get remaining attempts before rate limit
   */
  const getRemainingAttempts = useCallback(() => {
    const now = Date.now()
    const recentAttempts = validationAttempts.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    )
    return Math.max(0, MAX_VALIDATIONS_PER_MINUTE - recentAttempts.length)
  }, [validationAttempts])

  return {
    // Mutation
    validate: validationMutation.mutate,
    validateAsync: validationMutation.mutateAsync,
    isValidating: validationMutation.isPending,
    error: validationMutation.error,
    validationResult: validationMutation.data,

    // Applied promo state
    appliedPromo,
    setAppliedPromo,
    removePromo,
    hasAppliedPromo: appliedPromo !== null,

    // Rate limiting
    isRateLimited: isRateLimited(),
    remainingAttempts: getRemainingAttempts(),
  }
}

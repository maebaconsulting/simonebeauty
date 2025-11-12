/**
 * PromoCodeInput Component
 * Feature: 015-promo-codes-system
 *
 * Input field for entering and validating promo codes
 */

'use client'

import { useState } from 'react'
import { Loader2, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { getPromoErrorMessage } from '@/lib/utils/promo-formatting'
import { usePromoValidation } from '@/hooks/usePromoValidation'
import type { ValidatePromoParams } from '@/types/promo-validation'
import { cn } from '@/lib/utils'

interface PromoCodeInputProps {
  serviceId: number
  serviceAmount: number  // in cents
  userId: string | null
  onPromoApplied: (promoCode: string, discountAmount: number, finalAmount: number) => void
  className?: string
}

export function PromoCodeInput({
  serviceId,
  serviceAmount,
  userId,
  onPromoApplied,
  className,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const {
    validateAsync,
    isValidating,
    isRateLimited,
    remainingAttempts,
  } = usePromoValidation({
    onSuccess: (result) => {
      if (result.valid && result.discount_amount && result.final_amount) {
        setError(null)
        onPromoApplied(code, result.discount_amount, result.final_amount)
        setCode('') // Clear input after successful application
      } else {
        setError(getPromoErrorMessage(result.error_code))
      }
    },
    onError: (err) => {
      if (err.message === 'rate_limit_exceeded') {
        setError('Trop de tentatives. Veuillez réessayer dans quelques minutes.')
      } else {
        setError('Une erreur est survenue lors de la validation du code.')
      }
    },
  })

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Veuillez entrer un code promo')
      return
    }

    if (isRateLimited) {
      setError('Trop de tentatives. Veuillez réessayer dans quelques minutes.')
      return
    }

    const params: ValidatePromoParams = {
      code: code.trim().toUpperCase(),
      user_id: userId,
      service_id: serviceId,
      service_amount: serviceAmount,
    }

    try {
      await validateAsync(params)
    } catch (err) {
      // Error is handled in onError callback
      console.error('Promo validation failed:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApply()
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Entrez votre code promo"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null) // Clear error on input change
            }}
            onKeyDown={handleKeyDown}
            disabled={isValidating || isRateLimited}
            className="pl-10 uppercase"
            maxLength={50}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={!code.trim() || isValidating || isRateLimited}
          className="bg-[#FF9B8A] hover:bg-[#FF8A76] text-white"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validation...
            </>
          ) : (
            'Appliquer'
          )}
        </Button>
      </div>

      {error && (
        <ErrorMessage message={error} type="error" />
      )}

      {isRateLimited && (
        <p className="text-xs text-gray-500">
          Tentatives restantes: {remainingAttempts}/5
        </p>
      )}
    </div>
  )
}

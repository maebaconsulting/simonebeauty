/**
 * PromoCodeApplied Component
 * Feature: 015-promo-codes-system
 *
 * Display applied promo code with option to remove
 */

'use client'

import { X, Tag, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAmount } from '@/lib/utils/promo-calculations'
import { cn } from '@/lib/utils'

interface PromoCodeAppliedProps {
  code: string
  discountAmount: number  // In cents
  onRemove: () => void
  className?: string
}

export function PromoCodeApplied({
  code,
  discountAmount,
  onRemove,
  className,
}: PromoCodeAppliedProps) {
  return (
    <div
      className={cn(
        'bg-green-50 border border-green-200 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-green-100 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-green-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-green-600" />
              <p className="font-semibold text-green-900">
                Code promo appliqué !
              </p>
            </div>

            <p className="text-sm text-green-800 mb-2">
              Code: <span className="font-mono font-bold">{code}</span>
            </p>

            <p className="text-sm text-green-700">
              Vous économisez <span className="font-bold">{formatAmount(discountAmount)}</span>
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-green-700 hover:text-green-900 hover:bg-green-100"
          aria-label="Retirer le code promo"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

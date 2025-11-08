/**
 * Shared PriceDisplay component
 * Task: T009
 * Shows original vs reduced prices with promo applied
 */

import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  originalAmount: number
  discountAmount?: number
  finalAmount?: number
  promoCode?: string
  className?: string
}

export function PriceDisplay({
  originalAmount,
  discountAmount,
  finalAmount,
  promoCode,
  className
}: PriceDisplayProps) {
  const hasPromo = discountAmount && discountAmount > 0
  const displayAmount = finalAmount ?? originalAmount

  return (
    <div className={cn('space-y-2', className)}>
      {hasPromo && (
        <>
          {/* Original price (strikethrough) */}
          <div className="flex justify-between text-muted-foreground">
            <span className="line-through">Prix original</span>
            <span className="line-through">{originalAmount.toFixed(2)}€</span>
          </div>

          {/* Discount */}
          <div className="flex justify-between text-green-600">
            <span>
              Code promo {promoCode && `(${promoCode})`}
            </span>
            <span>-{discountAmount.toFixed(2)}€</span>
          </div>
        </>
      )}

      {/* Final amount */}
      <div className="flex justify-between font-bold text-lg border-t pt-2">
        <span>Total à payer</span>
        <span>{displayAmount.toFixed(2)}€</span>
      </div>
    </div>
  )
}

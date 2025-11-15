'use client'

import { useState, useEffect } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Gift, Tag, X, CheckCircle } from 'lucide-react'
import { PromoCodeInput } from '@/components/promo-codes/PromoCodeInput'
import { PromoCodeApplied } from '@/components/promo-codes/PromoCodeApplied'
import { createClient } from '@/lib/supabase/client'

// Load Stripe - Log the key being used for debugging
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
console.log('[Stripe] Loading Stripe with publishable key:', STRIPE_KEY.substring(0, 20) + '...' + STRIPE_KEY.slice(-4))

const stripePromise = loadStripe(STRIPE_KEY)

interface PromoCodeState {
  code: string
  discount: number
  isValid: boolean
  error: string | null
}

interface GiftCardState {
  code: string
  amount: number
  isValid: boolean
  error: string | null
  remainingBalance: number
}

interface PaymentFormProps {
  serviceId: number
  serviceAmount: number // in cents
  scheduledDatetime: string
  onSuccess: (paymentIntentId: string, paymentDetails?: PaymentDetails) => void
  onError: (error: string) => void
  onPromoStateChange?: (state: PromoCodeState | null) => void
  onGiftCardStateChange?: (state: GiftCardState | null) => void
}

interface PaymentDetails {
  promoCodeId?: number
  promoDiscount?: number
  giftCardId?: number
  giftCardCode?: string
  giftCardAmount?: number
}

/**
 * Stripe Payment Form Component
 * Handles:
 * - Promo code validation and application
 * - Gift card validation and application
 * - Stripe Payment Element integration
 * - Payment confirmation
 */
function PaymentFormInner({
  serviceAmount,
  clientSecret,
  promoState,
  giftCardState,
  paymentDetails,
  onSuccess,
  onError,
}: {
  serviceAmount: number
  clientSecret: string
  promoState: PromoCodeState | null
  giftCardState: GiftCardState | null
  paymentDetails: PaymentDetails
  onSuccess: (paymentIntentId: string, paymentDetails?: PaymentDetails) => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [elementError, setElementError] = useState<string | null>(null)

  // Listen for PaymentElement errors
  useEffect(() => {
    if (!elements) return

    const paymentElement = elements.getElement('payment')
    if (!paymentElement) return

    const handleElementChange = (event: any) => {
      if (event.error) {
        console.error('[PaymentElement] Error:', event.error)
        setElementError(event.error.message)
      } else {
        setElementError(null)
      }
    }

    paymentElement.on('change', handleElementChange)

    return () => {
      paymentElement.off('change', handleElementChange)
    }
  }, [elements])

  const calculateFinalAmount = () => {
    let final = serviceAmount
    if (promoState?.isValid) {
      final -= promoState.discount
    }
    if (giftCardState?.isValid) {
      final -= giftCardState.amount
    }
    return Math.max(0, final)
  }

  const finalAmount = calculateFinalAmount()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('[Payment] Submit started')
    console.log('[Payment] serviceAmount:', serviceAmount)
    console.log('[Payment] promoState:', promoState)
    console.log('[Payment] giftCardState:', giftCardState)
    console.log('[Payment] finalAmount:', finalAmount)
    console.log('[Payment] finalAmount > 0:', finalAmount > 0)
    console.log('[Payment] Stripe:', !!stripe)
    console.log('[Payment] Elements:', !!elements)
    console.log('[Payment] clientSecret:', clientSecret)

    // If amount is 0, invalid, or negative, this should be handled by the "no-payment-required" flow
    if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount)) {
      console.error('[Payment] Invalid amount:', finalAmount)
      onError('Montant invalide. Veuillez réessayer ou contacter le support.')
      return
    }

    if (!stripe || !elements) {
      console.error('[Payment] Stripe or elements not ready')
      onError('Le système de paiement n\'est pas prêt. Veuillez rafraîchir la page.')
      return
    }

    setIsProcessing(true)

    // Wait for PaymentElement to be ready (with retry)
    let paymentElement = elements.getElement('payment')
    let retries = 0
    const maxRetries = 5

    while (!paymentElement && retries < maxRetries) {
      console.log(`[Payment] Waiting for PaymentElement... (attempt ${retries + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
      paymentElement = elements.getElement('payment')
      retries++
    }

    console.log('[Payment] PaymentElement mounted:', !!paymentElement)
    if (!paymentElement) {
      console.error('[Payment] PaymentElement not mounted after retries!')
      console.error('[Payment] This usually indicates invalid Stripe API keys or network issues')
      setIsProcessing(false)
      onError('Le formulaire de paiement n\'a pas pu se charger. Cela peut indiquer un problème de configuration Stripe ou de connexion. Veuillez rafraîchir la page ou contacter le support.')
      return
    }

    try {
      console.log('[Payment] Confirming payment...')
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation?payment=success`,
        },
        redirect: 'if_required',
      })

      console.log('[Payment] Confirmation result:', { error, paymentIntent })

      if (error) {
        console.error('[Payment] Error:', error)
        onError(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('[Payment] Success:', paymentIntent.id)
        onSuccess(paymentIntent.id, paymentDetails)
      } else {
        console.error('[Payment] Unexpected state:', paymentIntent?.status)
        onError('Payment status unexpected: ' + paymentIntent?.status)
      }
    } catch (err) {
      console.error('[Payment] Unexpected error:', err)
      console.error('[Payment] Error details:', JSON.stringify(err))
      onError('An unexpected error occurred: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Price Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Montant du service</span>
            <span>{(serviceAmount / 100).toFixed(2)} €</span>
          </div>

          {promoState?.isValid && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Code promo appliqué
              </span>
              <span>-{(promoState.discount / 100).toFixed(2)} €</span>
            </div>
          )}

          {giftCardState?.isValid && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Gift className="w-4 h-4" />
                Carte cadeau appliquée
              </span>
              <span>-{(giftCardState.amount / 100).toFixed(2)} €</span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total à payer</span>
            <span>{(finalAmount / 100).toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Element */}
      {finalAmount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PaymentElement />
            {elementError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Erreur:</strong> {elementError}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Vérifiez votre connexion internet ou contactez le support.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-sm text-red-500">
          ⚠️ Montant final: {finalAmount} (PaymentElement non affiché car montant ≤ 0)
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-base bg-button-primary hover:bg-button-primary-hover text-white font-semibold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Traitement en cours...
          </>
        ) : finalAmount > 0 ? (
          `Payer ${(finalAmount / 100).toFixed(2)} €`
        ) : (
          'Confirmer la réservation'
        )}
      </Button>
    </form>
  )
}

export function StripePaymentForm({
  serviceId,
  serviceAmount,
  scheduledDatetime,
  onSuccess,
  onError,
  onPromoStateChange,
  onGiftCardStateChange,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Promo code state (managed by PromoCodeInput component)
  const [promoState, setPromoState] = useState<PromoCodeState | null>(null)

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardState, setGiftCardState] = useState<GiftCardState | null>(null)
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false)

  // Payment details to pass to booking creation
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({})

  // Fetch user ID on mount (silent - guests are allowed)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        // Silent failure for guests - this is expected behavior
        if (error) {
          console.log('[StripePaymentForm] Guest user detected (no auth session)')
          setUserId(null)
          return
        }

        setUserId(user?.id || null)
      } catch (err) {
        // Silent failure - guest users are allowed
        console.log('[StripePaymentForm] Could not fetch user, proceeding as guest')
        setUserId(null)
      }
    }
    fetchUser()
  }, [])

  // Handler for when promo is successfully applied
  const handlePromoApplied = (code: string, discountAmount: number, finalAmount: number) => {
    const newState = {
      code,
      discount: discountAmount,
      isValid: true,
      error: null,
    }
    setPromoState(newState)
    onPromoStateChange?.(newState)
  }

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return

    setIsValidatingGiftCard(true)
    try {
      // Calculate remaining amount after promo
      let amountToApply = serviceAmount
      if (promoState?.isValid) {
        amountToApply -= promoState.discount
      }

      const res = await fetch('/api/bookings/validate-gift-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: giftCardCode,
          amount_to_apply: amountToApply,
        }),
      })

      const data = await res.json()

      if (data.valid) {
        const newState = {
          code: giftCardCode,
          amount: data.amount_to_apply,
          isValid: true,
          error: null,
          remainingBalance: data.remaining_balance,
        }
        setGiftCardState(newState)
        onGiftCardStateChange?.(newState)
      } else {
        const newState = {
          code: giftCardCode,
          amount: 0,
          isValid: false,
          error: data.error || 'Carte cadeau invalide',
          remainingBalance: 0,
        }
        setGiftCardState(newState)
        onGiftCardStateChange?.(newState)
      }
    } catch (err) {
      const newState = {
        code: giftCardCode,
        amount: 0,
        isValid: false,
        error: 'Erreur lors de la validation',
        remainingBalance: 0,
      }
      setGiftCardState(newState)
      onGiftCardStateChange?.(newState)
    } finally {
      setIsValidatingGiftCard(false)
    }
  }

  const handleRemovePromo = () => {
    setPromoState(null)
    onPromoStateChange?.(null)
  }

  const handleRemoveGiftCard = () => {
    setGiftCardCode('')
    setGiftCardState(null)
    onGiftCardStateChange?.(null)
  }

  // Create payment intent when promo/gift card changes
  useEffect(() => {
    const createPaymentIntent = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/bookings/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: serviceId,
            service_amount: serviceAmount,
            promo_code: promoState?.isValid ? promoState.code : undefined,
            gift_card_code: giftCardState?.isValid ? giftCardState.code : undefined,
            scheduled_datetime: scheduledDatetime,
          }),
        })

        const data = await res.json()

        // Store payment details (promo/gift card IDs and amounts)
        setPaymentDetails({
          promoCodeId: data.promo_id || undefined,
          promoDiscount: data.promo_discount ? data.promo_discount / 100 : undefined,
          giftCardId: data.gift_card_id || undefined,
          giftCardCode: giftCardState?.code || undefined,
          giftCardAmount: data.gift_card_amount ? data.gift_card_amount / 100 : undefined,
        })

        if (data.payment_required && data.client_secret) {
          setClientSecret(data.client_secret)
        } else if (!data.payment_required) {
          // Payment fully covered by promo/gift card
          setClientSecret('no-payment-required')
        } else {
          onError(data.error || 'Failed to create payment intent')
        }
      } catch (err) {
        console.error('[Payment] Error creating intent:', err)
        onError('Failed to initialize payment')
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [serviceId, serviceAmount, promoState, giftCardState, scheduledDatetime, onError])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-button-primary" />
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-12 text-gray-600">
        Initialisation du paiement...
      </div>
    )
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret: clientSecret === 'no-payment-required' ? undefined : clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#E97B6E',
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Promo Code Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Code promo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {promoState?.isValid ? (
            <PromoCodeApplied
              code={promoState.code}
              discountAmount={promoState.discount}
              onRemove={handleRemovePromo}
            />
          ) : (
            <PromoCodeInput
              serviceId={serviceId}
              serviceAmount={serviceAmount}
              userId={userId}
              onPromoApplied={handlePromoApplied}
            />
          )}
        </CardContent>
      </Card>

      {/* Gift Card Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Carte cadeau
          </CardTitle>
        </CardHeader>
        <CardContent>
          {giftCardState?.isValid ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{giftCardState.code}</p>
                    <p className="text-sm text-green-700">
                      -{(giftCardState.amount / 100).toFixed(2)} € appliqué
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveGiftCard}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {giftCardState.remainingBalance > 0 && (
                <p className="text-sm text-gray-600">
                  Solde restant : {(giftCardState.remainingBalance / 100).toFixed(2)} €
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Entrez votre code carte cadeau"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                  disabled={isValidatingGiftCard}
                />
                <Button
                  type="button"
                  onClick={handleApplyGiftCard}
                  disabled={!giftCardCode.trim() || isValidatingGiftCard}
                >
                  {isValidatingGiftCard ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Appliquer'
                  )}
                </Button>
              </div>
              {giftCardState?.error && (
                <p className="text-sm text-red-600">{giftCardState.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form */}
      {clientSecret && clientSecret !== 'no-payment-required' && (
        <Elements
          key={clientSecret}
          stripe={stripePromise}
          options={elementsOptions}
        >
          <PaymentFormInner
            serviceAmount={serviceAmount}
            clientSecret={clientSecret}
            promoState={promoState}
            giftCardState={giftCardState}
            paymentDetails={paymentDetails}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      )}

      {clientSecret === 'no-payment-required' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-900 mb-2">
            Paiement entièrement couvert !
          </p>
          <p className="text-gray-600 mb-6">
            Votre réservation est entièrement payée par votre code promo et/ou carte cadeau.
          </p>
          <Button
            onClick={() => onSuccess('no-payment-required', paymentDetails)}
            className="w-full h-12 text-base bg-button-primary hover:bg-button-primary-hover text-white font-semibold"
          >
            Confirmer la réservation
          </Button>
        </div>
      )}
    </div>
  )
}

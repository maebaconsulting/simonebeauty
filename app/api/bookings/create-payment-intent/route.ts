import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer } from '@/lib/stripe/payment'
import { stripe } from '@/lib/stripe/config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/create-payment-intent
 * Create Stripe PaymentIntent with promo code and/or gift card applied
 *
 * Body:
 * - service_id: number
 * - service_amount: number (in cents, original price)
 * - promo_code?: string (optional)
 * - gift_card_code?: string (optional)
 * - scheduled_datetime: string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      service_id,
      service_amount,
      promo_code,
      gift_card_code,
      scheduled_datetime,
    } = body

    console.log('[Create PaymentIntent] Received body:', {
      service_id,
      service_amount,
      promo_code,
      gift_card_code,
      scheduled_datetime,
    })

    // Validate required fields
    if (!service_id || !service_amount || !scheduled_datetime) {
      console.error('[Create PaymentIntent] Missing fields:', {
        has_service_id: !!service_id,
        has_service_amount: !!service_amount,
        has_scheduled_datetime: !!scheduled_datetime,
        service_amount_value: service_amount,
      })
      return NextResponse.json(
        { error: 'Missing required fields', details: { service_id: !!service_id, service_amount: !!service_amount, scheduled_datetime: !!scheduled_datetime } },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (service_amount <= 0) {
      console.error('[Create PaymentIntent] Invalid amount:', service_amount)
      return NextResponse.json(
        { error: 'Service amount must be greater than 0', details: { service_amount } },
        { status: 400 }
      )
    }

    console.log('[Create PaymentIntent] Input:', {
      service_id,
      service_amount,
      promo_code,
      gift_card_code,
    })

    // Get service details
    const { data: service } = await supabase
      .from('services')
      .select('id, name')
      .eq('id', service_id)
      .single()

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    let finalAmount = service_amount // Start with original amount
    let promoDiscount = 0
    let giftCardAmount = 0
    let promoId: number | null = null
    let giftCardId: number | null = null

    // Apply promo code if provided
    if (promo_code) {
      const { data: promoData } = await supabase.rpc('validate_promo_code', {
        p_code: promo_code.toUpperCase(),
        p_user_id: user.id,
        p_service_id: service_id,
        p_service_amount: service_amount / 100, // Convert to euros
      })

      if (promoData && promoData[0]?.is_valid) {
        promoDiscount = Math.round(promoData[0].discount_amount * 100) // Convert to cents
        promoId = promoData[0].promo_id
        finalAmount -= promoDiscount
        console.log('[Create PaymentIntent] Promo applied:', {
          promoDiscount,
          finalAmount,
        })
      } else {
        return NextResponse.json(
          {
            error: 'Invalid promo code',
            details: promoData?.[0]?.error_message || 'Unknown error',
          },
          { status: 400 }
        )
      }
    }

    // Apply gift card if provided
    if (gift_card_code) {
      const { data: giftData } = await supabase.rpc('validate_gift_card', {
        p_code: gift_card_code.toUpperCase(),
        p_user_id: user.id,
        p_user_email: user.email || '',
        p_amount_to_apply: finalAmount / 100, // Convert to euros, apply to remaining amount
      })

      if (giftData && giftData[0]?.is_valid) {
        giftCardAmount = Math.round(giftData[0].amount_to_apply * 100) // Convert to cents
        giftCardId = giftData[0].gift_card_id
        finalAmount -= giftCardAmount
        console.log('[Create PaymentIntent] Gift card applied:', {
          giftCardAmount,
          finalAmount,
        })
      } else {
        return NextResponse.json(
          {
            error: 'Invalid gift card',
            details: giftData?.[0]?.error_message || 'Unknown error',
          },
          { status: 400 }
        )
      }
    }

    // Ensure amount is not negative
    if (finalAmount < 0) {
      finalAmount = 0
    }

    console.log('[Create PaymentIntent] Final calculation:', {
      originalAmount: service_amount,
      promoDiscount,
      giftCardAmount,
      finalAmount,
      stripeAmount: finalAmount,
    })

    // If final amount is 0, no payment needed (fully covered by gift card/promo)
    if (finalAmount === 0) {
      return NextResponse.json({
        payment_required: false,
        original_amount: service_amount,
        promo_discount: promoDiscount,
        gift_card_amount: giftCardAmount,
        final_amount: 0,
        promo_id: promoId,
        gift_card_id: giftCardId,
      })
    }

    // Get or create Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email || '',
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      phone: profile.phone || undefined,
    })

    console.log('[Create PaymentIntent] Stripe customer:', stripeCustomer.id)

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount, // Amount in cents
      currency: 'eur',
      customer: stripeCustomer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        service_id: service_id.toString(),
        service_name: service.name,
        original_amount: service_amount.toString(),
        promo_discount: promoDiscount.toString(),
        promo_id: promoId?.toString() || '',
        gift_card_amount: giftCardAmount.toString(),
        gift_card_id: giftCardId?.toString() || '',
        gift_card_code: gift_card_code || '',
        scheduled_datetime,
      },
      description: `Réservation Simone - ${service.name}${
        promoDiscount > 0 ? ` (Promo: -${(promoDiscount / 100).toFixed(2)}€)` : ''
      }${giftCardAmount > 0 ? ` (Carte cadeau: -${(giftCardAmount / 100).toFixed(2)}€)` : ''}`,
    })

    console.log('[Create PaymentIntent] Created:', paymentIntent.id)

    return NextResponse.json({
      payment_required: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      original_amount: service_amount,
      promo_discount: promoDiscount,
      gift_card_amount: giftCardAmount,
      final_amount: finalAmount,
      promo_id: promoId,
      gift_card_id: giftCardId,
    })
  } catch (error) {
    console.error('[Create PaymentIntent] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

import Stripe from 'stripe'
import { stripe } from './config'

/**
 * Create a payment intent for booking pre-authorization
 * This creates a hold on the customer's card without charging it
 */
export async function createBookingPaymentIntent(params: {
  amount: number // Amount in euros (will be converted to cents)
  currency?: string
  customerId?: string
  metadata?: {
    booking_id: string
    client_id: string
    service_id: number
    [key: string]: string | number
  }
  description?: string
}): Promise<Stripe.PaymentIntent> {
  const {
    amount,
    currency = 'eur',
    customerId,
    metadata,
    description,
  } = params

  // Convert euros to cents (Stripe uses smallest currency unit)
  const amountInCents = Math.round(amount * 100)

  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: amountInCents,
    currency,
    capture_method: 'manual', // Pre-authorization - don't charge immediately
    metadata: metadata || {},
    description: description || 'Simone Paris - Service Booking',
  }

  if (customerId) {
    paymentIntentParams.customer = customerId
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

  return paymentIntent
}

/**
 * Capture a previously authorized payment
 * Called after service completion
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number // Optional: capture partial amount
): Promise<Stripe.PaymentIntent> {
  const captureParams: Stripe.PaymentIntentCaptureParams = {}

  if (amountToCapture) {
    // Convert to cents
    captureParams.amount_to_capture = Math.round(amountToCapture * 100)
  }

  const paymentIntent = await stripe.paymentIntents.capture(
    paymentIntentId,
    captureParams
  )

  return paymentIntent
}

/**
 * Cancel a payment intent (release the hold)
 * Called when booking is cancelled before service
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  cancellationReason?: Stripe.PaymentIntentCancelParams.CancellationReason
): Promise<Stripe.PaymentIntent> {
  const cancelParams: Stripe.PaymentIntentCancelParams = {}

  if (cancellationReason) {
    cancelParams.cancellation_reason = cancellationReason
  }

  const paymentIntent = await stripe.paymentIntents.cancel(
    paymentIntentId,
    cancelParams
  )

  return paymentIntent
}

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string
  email: string
  name?: string
  phone?: string
}): Promise<Stripe.Customer> {
  const { userId, email, name, phone } = params

  // Search for existing customer by metadata
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    phone,
    metadata: {
      user_id: userId,
    },
  })

  return customer
}

/**
 * Add tip to a completed payment
 * Creates a new charge for the tip amount
 */
export async function addTipToPayment(params: {
  customerId: string
  tipAmount: number // in euros
  paymentMethodId: string
  metadata?: {
    booking_id: string
    contractor_id: string
    [key: string]: string
  }
}): Promise<Stripe.PaymentIntent> {
  const { customerId, tipAmount, paymentMethodId, metadata } = params

  // Convert tip to cents
  const tipInCents = Math.round(tipAmount * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: tipInCents,
    currency: 'eur',
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    metadata: {
      type: 'tip',
      ...metadata,
    },
    description: 'Pourboire pour prestataire - Simone Paris',
  })

  return paymentIntent
}

/**
 * Process refund for cancelled booking
 */
export async function refundPayment(params: {
  paymentIntentId: string
  amount?: number // Optional: partial refund in euros
  reason?: Stripe.Refund.Reason
}): Promise<Stripe.Refund> {
  const { paymentIntentId, amount, reason } = params

  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount) {
    refundParams.amount = Math.round(amount * 100)
  }

  if (reason) {
    // Type assertion needed because newer Stripe API versions have stricter reason types
    refundParams.reason = reason as Stripe.RefundCreateParams.Reason
  }

  const refund = await stripe.refunds.create(refundParams)

  return refund
}

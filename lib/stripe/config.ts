import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

/**
 * Get Stripe SDK instance - Server-side only
 * Lazy initialization to avoid build-time errors
 * DO NOT use this on the client side
 */
function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
  })

  return stripeInstance
}

/**
 * Stripe SDK instance - Server-side only
 * DO NOT use this on the client side
 * Uses getter pattern for lazy initialization
 */
export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const instance = getStripeInstance()
    const value = instance[prop as keyof Stripe]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

/**
 * Get Stripe publishable key for client-side
 */
export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  return key
}

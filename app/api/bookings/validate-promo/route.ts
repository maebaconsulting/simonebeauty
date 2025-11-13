import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/validate-promo
 * Validate promo code and calculate discount
 *
 * Body:
 * - code: string
 * - service_id: number
 * - service_amount: number (in cents)
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

    const body = await request.json()
    const { code, service_id, service_amount } = body

    // Validate input
    if (!code || !service_id || !service_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[Validate Promo] Validating:', { code, service_id, service_amount })

    // Call PostgreSQL function to validate promo code
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code.toUpperCase(),
      p_user_id: user.id,
      p_service_id: parseInt(service_id),
      p_service_amount: parseFloat((service_amount / 100).toFixed(2)), // Convert cents to euros
    })

    if (error) {
      console.error('[Validate Promo] Error calling function:', error)
      return NextResponse.json(
        { error: 'Failed to validate promo code' },
        { status: 500 }
      )
    }

    // Function returns array with single result
    const result = data[0]

    console.log('[Validate Promo] Result:', result)

    if (!result.is_valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error_message,
        },
        { status: 200 } // Not an error, just invalid code
      )
    }

    // Return valid promo code details
    return NextResponse.json({
      valid: true,
      promo_id: result.promo_id,
      discount_amount: Math.round(result.discount_amount * 100), // Convert to cents
      final_amount: Math.round(result.final_amount * 100), // Convert to cents
      original_amount: service_amount,
    })
  } catch (error) {
    console.error('[Validate Promo] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

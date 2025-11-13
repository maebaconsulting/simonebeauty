import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/validate-gift-card
 * Validate gift card and calculate applicable amount
 *
 * Body:
 * - code: string
 * - amount_to_apply: number (in cents) - total amount user wants to pay with gift card
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
    const { code, amount_to_apply } = body

    // Validate input
    if (!code || !amount_to_apply) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[Validate Gift Card] Validating:', { code, amount_to_apply })

    // Call PostgreSQL function to validate gift card
    const { data, error } = await supabase.rpc('validate_gift_card', {
      p_code: code.toUpperCase(),
      p_user_id: user.id,
      p_user_email: user.email || '',
      p_amount_to_apply: parseFloat((amount_to_apply / 100).toFixed(2)), // Convert cents to euros
    })

    if (error) {
      console.error('[Validate Gift Card] Error calling function:', error)
      return NextResponse.json(
        { error: 'Failed to validate gift card' },
        { status: 500 }
      )
    }

    // Function returns array with single result
    const result = data[0]

    console.log('[Validate Gift Card] Result:', result)

    if (!result.is_valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error_message,
        },
        { status: 200 } // Not an error, just invalid code
      )
    }

    // Return valid gift card details
    return NextResponse.json({
      valid: true,
      gift_card_id: result.gift_card_id,
      available_amount: Math.round(result.available_amount * 100), // Convert to cents
      amount_to_apply: Math.round(result.amount_to_apply * 100), // Convert to cents
      remaining_balance: Math.round((result.available_amount - result.amount_to_apply) * 100), // Convert to cents
    })
  } catch (error) {
    console.error('[Validate Gift Card] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

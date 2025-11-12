import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Test endpoint for promo code validation
 * GET /api/test-promo?code=WELCOME20&service_id=1&amount=5000
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const serviceId = searchParams.get('service_id')
    const amount = searchParams.get('amount')

    if (!code || !serviceId || !amount) {
      return NextResponse.json(
        { error: 'Missing parameters: code, service_id, amount required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Call validate_promo_code RPC function
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code.toUpperCase(),
      p_user_id: null, // Guest user test
      p_service_id: parseInt(serviceId),
      p_service_amount: parseFloat(amount) / 100, // Convert cents to euros
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      )
    }

    // RPC returns array with single result
    const result = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: true,
      input: {
        code: code.toUpperCase(),
        service_id: parseInt(serviceId),
        amount_cents: parseInt(amount),
        amount_euros: parseFloat(amount) / 100,
      },
      result: {
        is_valid: result.is_valid,
        promo_id: result.promo_id,
        discount_amount_euros: result.discount_amount,
        final_amount_euros: result.final_amount,
        discount_amount_cents: result.is_valid ? Math.round(result.discount_amount * 100) : 0,
        final_amount_cents: result.is_valid ? Math.round(result.final_amount * 100) : 0,
        error_message: result.error_message,
      },
    })
  } catch (err) {
    console.error('[Test Promo] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

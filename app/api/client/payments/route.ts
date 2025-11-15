import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/payments
 * Fetch all payment methods for the authenticated client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch payment methods
    const { data: paymentMethods, error: fetchError } = await supabase
      .from('client_payment_methods')
      .select('*')
      .eq('client_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching payment methods:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payment_methods: paymentMethods || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/client/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/payments
 * Add a new payment method for the client
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.stripe_payment_method_id) {
      return NextResponse.json(
        { error: 'stripe_payment_method_id is required' },
        { status: 400 }
      );
    }

    // Build insert data
    const insertData: Record<string, any> = {
      client_id: user.id,
      stripe_payment_method_id: body.stripe_payment_method_id,
      payment_type: body.payment_type || 'card',
      is_default: body.is_default || false,
    };

    // Add card details if provided
    if (body.card_brand) insertData.card_brand = body.card_brand;
    if (body.card_last4) insertData.card_last4 = body.card_last4;
    if (body.card_exp_month) insertData.card_exp_month = body.card_exp_month;
    if (body.card_exp_year) insertData.card_exp_year = body.card_exp_year;

    // Add bank details if provided
    if (body.bank_name) insertData.bank_name = body.bank_name;
    if (body.bank_account_last4) insertData.bank_account_last4 = body.bank_account_last4;

    // Add PayPal details if provided
    if (body.paypal_email) insertData.paypal_email = body.paypal_email;

    // Add billing address if provided
    if (body.billing_address_line1) insertData.billing_address_line1 = body.billing_address_line1;
    if (body.billing_address_line2) insertData.billing_address_line2 = body.billing_address_line2;
    if (body.billing_city) insertData.billing_city = body.billing_city;
    if (body.billing_postal_code) insertData.billing_postal_code = body.billing_postal_code;
    if (body.billing_country) insertData.billing_country = body.billing_country;

    // Insert payment method
    const { data: paymentMethod, error: insertError } = await supabase
      .from('client_payment_methods')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting payment method:', insertError);

      // Check for duplicate stripe_payment_method_id
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This payment method is already saved' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to add payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Payment method added successfully',
      payment_method: paymentMethod,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/client/payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

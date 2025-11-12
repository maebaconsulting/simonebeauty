import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { capturePaymentIntent } from '@/lib/stripe/payment';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/capture-payment
 * Capture the pre-authorized payment after service completion
 *
 * Body params:
 * - amount_to_capture (optional): Partial amount to capture in euros
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
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

    // Check if user is admin/manager or the assigned contractor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('appointment_bookings')
      .select('*, contractor_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify authorization (admin, manager, or assigned contractor)
    const isAuthorized =
      profile.role === 'admin' ||
      profile.role === 'manager' ||
      (booking.contractor_id === user.id && profile.role === 'contractor');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Not authorized to capture this payment' },
        { status: 403 }
      );
    }

    // Check if payment intent exists
    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found for this booking' },
        { status: 400 }
      );
    }

    // Check booking status
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return NextResponse.json(
        { error: `Cannot capture payment for booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { amount_to_capture } = body;

    // Capture the payment
    try {
      const paymentIntent = await capturePaymentIntent(
        booking.stripe_payment_intent_id,
        amount_to_capture
      );

      console.log('✅ Payment captured successfully:', paymentIntent.id);

      // Update booking status to completed
      const { error: updateError } = await supabase
        .from('appointment_bookings')
        .update({
          status: 'completed',
          payment_status: 'captured',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('⚠️  Failed to update booking status:', updateError);
      }

      return NextResponse.json({
        success: true,
        payment_intent_id: paymentIntent.id,
        amount_captured: paymentIntent.amount_capturable || paymentIntent.amount,
        currency: paymentIntent.currency,
        message: 'Payment captured successfully',
      });

    } catch (stripeError) {
      console.error('❌ Failed to capture payment:', stripeError);
      return NextResponse.json(
        {
          error: 'Failed to capture payment',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/bookings/[id]/capture-payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelPaymentIntent, refundPayment } from '@/lib/stripe/payment';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/cancel
 * Cancel a booking and release/refund the payment
 *
 * Body params:
 * - cancellation_reason: Reason for cancellation
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

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('appointment_bookings')
      .select('*, contractor_id, client_id, payment_status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify authorization (client who made booking, contractor, admin, or manager)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthorized =
      booking.client_id === user.id || // Client who made booking
      booking.contractor_id === user.id || // Assigned contractor
      profile?.role === 'admin' ||
      profile?.role === 'manager';

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Not authorized to cancel this booking' },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { cancellation_reason } = body;

    // Handle payment based on current status
    let paymentAction = null;

    if (booking.stripe_payment_intent_id) {
      try {
        if (booking.payment_status === 'captured') {
          // Payment was already captured - issue refund
          const refund = await refundPayment({
            paymentIntentId: booking.stripe_payment_intent_id,
            reason: 'requested_by_customer',
          });
          paymentAction = {
            type: 'refund',
            id: refund.id,
            amount: refund.amount / 100,
          };
          console.log('✅ Payment refunded:', refund.id);
        } else {
          // Payment was not captured yet - just cancel the hold
          const cancelledIntent = await cancelPaymentIntent(
            booking.stripe_payment_intent_id,
            'requested_by_customer'
          );
          paymentAction = {
            type: 'cancelled',
            id: cancelledIntent.id,
          };
          console.log('✅ Payment hold released:', cancelledIntent.id);
        }
      } catch (stripeError) {
        console.error('❌ Failed to process payment cancellation:', stripeError);
        return NextResponse.json(
          {
            error: 'Failed to process payment cancellation',
            details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('appointment_bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellation_reason || 'Cancelled by user',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel booking', details: updateError.message },
        { status: 500 }
      );
    }

    // TODO: Send cancellation notification emails

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      payment_action: paymentAction,
      message: 'Booking cancelled successfully',
    });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/bookings/[id]/cancel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

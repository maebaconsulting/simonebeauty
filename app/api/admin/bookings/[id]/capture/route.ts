import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { capturePaymentIntent } from '@/lib/stripe/payment';
import { ManualCaptureRequest, ManualCaptureResponse } from '@/types/booking';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/bookings/[id]/capture
 * Manually capture payment for a booking (admin/manager only)
 * SpecKit: spec 005 User Story 9 - Capture Manuelle de Paiement
 * FR-031: Admin peut forcer capture manuelle
 * FR-032: Logger capture avec performed_by_type='admin'
 * FR-033: Notifier client ET prestataire
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id);
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

    // Verify admin/manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager role required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: ManualCaptureRequest = await request.json();
    const { amount_to_capture, notify_parties = true, admin_notes } = body;

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('appointment_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Validate booking status (FR-031: must be in_progress or completed_by_contractor)
    if (!['in_progress', 'completed_by_contractor'].includes(booking.status)) {
      return NextResponse.json(
        {
          error: 'Invalid booking status',
          details: `Booking must be in_progress or completed_by_contractor to capture payment. Current status: ${booking.status}`
        },
        { status: 400 }
      );
    }

    // Validate payment intent exists
    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found for this booking' },
        { status: 400 }
      );
    }

    // Check if already captured
    if (booking.payment_status === 'captured') {
      return NextResponse.json(
        { error: 'Payment has already been captured' },
        { status: 400 }
      );
    }

    // Capture payment via Stripe
    let paymentIntent;
    try {
      paymentIntent = await capturePaymentIntent(
        booking.stripe_payment_intent_id,
        amount_to_capture
      );
      console.log('✅ Admin manual capture successful:', paymentIntent.id);
    } catch (stripeError) {
      console.error('❌ Stripe capture failed:', stripeError);
      return NextResponse.json(
        {
          error: 'Payment capture failed',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    const capturedAmount = paymentIntent.amount_received / 100;

    // Update booking status
    const { error: updateError } = await supabase
      .from('appointment_bookings')
      .update({
        status: 'completed',
        payment_status: 'captured',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('❌ Failed to update booking:', updateError);
      // Payment captured but DB update failed - critical!
      return NextResponse.json(
        {
          error: 'Payment captured but booking update failed',
          details: updateError.message,
          payment_intent_id: paymentIntent.id
        },
        { status: 500 }
      );
    }

    // FR-032: Log action in service_action_logs
    const { error: logError } = await supabase
      .from('service_action_logs')
      .insert({
        booking_id: bookingId,
        action_type: 'capture_manual',
        performed_by_type: 'admin',
        performed_by_id: user.id,
        metadata: {
          payment_intent_id: paymentIntent.id,
          amount_captured: capturedAmount,
          admin_name: `${profile.first_name} ${profile.last_name}`,
          admin_notes: admin_notes || null,
          captured_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('⚠️  Failed to log action:', logError);
      // Non-critical, continue
    }

    // FR-033: Send notifications if requested
    if (notify_parties) {
      // TODO: Implement email notifications
      // - Send email to client confirming payment
      // - Send email to contractor confirming payment capture
      console.log('📧 TODO: Send notification emails to client and contractor');
    }

    const response: ManualCaptureResponse = {
      success: true,
      booking_id: bookingId,
      payment_intent_id: paymentIntent.id,
      amount_captured: capturedAmount,
      message: 'Payment captured successfully',
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/admin/bookings/[id]/capture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

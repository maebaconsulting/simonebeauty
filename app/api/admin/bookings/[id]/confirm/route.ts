import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/bookings/[id]/confirm
 * Manually confirm a pending booking (admin/manager only)
 * SpecKit: spec 005 User Story 5 - Gestion des Réservations
 *
 * This confirms the booking without capturing payment.
 * Payment capture happens separately when the service is completed.
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

    // Parse request body (optional notes)
    const body = await request.json().catch(() => ({}));
    const { admin_notes, notify_parties = true } = body;

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

    // Validate booking status - must be pending
    if (booking.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Invalid booking status',
          details: `Booking must be pending to confirm. Current status: ${booking.status}`
        },
        { status: 400 }
      );
    }

    // Check if already confirmed
    if (booking.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Booking is already confirmed' },
        { status: 400 }
      );
    }

    // Update booking status to confirmed (NO payment capture)
    const { error: updateError } = await supabase
      .from('appointment_bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('❌ Failed to update booking:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to confirm booking',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    // Update corresponding booking_request if exists
    const { data: bookingRequest } = await supabase
      .from('booking_requests')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (bookingRequest) {
      await supabase
        .from('booking_requests')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingRequest.id);
    }

    // Log action in service_action_logs
    const { error: logError } = await supabase
      .from('service_action_logs')
      .insert({
        booking_id: bookingId,
        action_type: 'confirm_manual',
        performed_by_type: 'admin',
        performed_by_id: user.id,
        metadata: {
          admin_name: `${profile.first_name} ${profile.last_name}`,
          admin_notes: admin_notes || null,
          confirmed_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('⚠️  Failed to log action:', logError);
      // Non-critical, continue
    }

    // Send notifications if requested
    if (notify_parties) {
      // TODO: Implement email/SMS notifications
      // - Send confirmation to client
      // - Send notification to contractor
      console.log('📧 TODO: Send confirmation notifications to client and contractor');
    }

    console.log(`✅ Admin manually confirmed booking ${bookingId}`);

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      message: 'Booking confirmed successfully',
      status: 'confirmed'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/admin/bookings/[id]/confirm:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdminBookingDetails } from '@/types/booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bookings/[id]
 * Get detailed booking information with action logs (admin/manager only)
 * SpecKit: spec 005 User Story 5 - Gestion des Réservations
 * FR-017: Consulter détails d'une réservation
 */
export async function GET(
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

    // Verify admin/manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager role required' },
        { status: 403 }
      );
    }

    // Fetch booking with service data
    // Note: Using service_id FK for service join, client/contractor profiles separately
    const { data: booking, error: bookingError } = await supabase
      .from('appointment_bookings')
      .select(`
        *,
        service:service_id (
          name,
          category,
          base_duration_minutes,
          base_price
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('⚠️  Error fetching booking:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Fetch client profile separately if client_id exists
    let client_profile = null;
    if (booking.client_id) {
      const { data: clientData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, avatar_url')
        .eq('id', booking.client_id)
        .single();
      client_profile = clientData;
    }

    // Fetch contractor profile separately if contractor_id exists
    let contractor_profile = null;
    if (booking.contractor_id) {
      const { data: contractorData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, avatar_url, professional_title')
        .eq('id', booking.contractor_id)
        .single();
      contractor_profile = contractorData;
    }

    // Fetch action logs for this booking
    const { data: actionLogs, error: logsError } = await supabase
      .from('service_action_logs')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('⚠️  Error fetching action logs:', logsError);
      // Non-critical error, continue without logs
    }

    // Transform data to match AdminBookingDetails interface
    const bookingDetails: AdminBookingDetails = {
      ...booking,
      client_profile,
      contractor_profile,
      service: booking.service,
      action_logs: actionLogs || [],
    };

    return NextResponse.json({
      success: true,
      data: bookingDetails,
    });

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/admin/bookings/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdminBookingWithDetails, AdminBookingFilters } from '@/types/booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bookings
 * List all bookings with filters (admin/manager only)
 * SpecKit: spec 005 User Story 5 - Gestion des Réservations
 * FR-016: Rechercher et filtrer les réservations
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: AdminBookingFilters = {
      status: searchParams.get('status') as any || 'all',
      payment_status: searchParams.get('payment_status') as any || 'all',
      search: searchParams.get('search') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      contractor_id: searchParams.get('contractor_id') || undefined,
      market_id: searchParams.get('market_id') ? parseInt(searchParams.get('market_id')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Build query
    // Note: contractor_id references contractors table, not profiles
    let query = supabase
      .from('appointment_bookings')
      .select(`
        *,
        service:services (
          name,
          category,
          base_duration_minutes,
          base_price
        ),
        contractor:contractors!appointment_bookings_contractor_id_fkey (
          market_id,
          market:markets (
            id,
            code,
            name,
            currency_code
          )
        )
      `, { count: 'exact' });

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Apply payment status filter
    if (filters.payment_status && filters.payment_status !== 'all') {
      query = query.eq('payment_status', filters.payment_status);
    }

    // Apply date range filter
    if (filters.date_from) {
      query = query.gte('scheduled_datetime', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('scheduled_datetime', filters.date_to);
    }

    // Apply contractor filter
    if (filters.contractor_id) {
      query = query.eq('contractor_id', filters.contractor_id);
    }

    // Apply market filter (via contractor relationship)
    if (filters.market_id) {
      // Note: This filters at the database level using the joined contractor.market_id
      // We'll need to post-process results since direct filtering on nested relations isn't supported
      // For now, we'll filter after the query results
    }

    // Apply search filter (client name, email, booking ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      // Check if search is a number (booking ID)
      if (!isNaN(Number(filters.search))) {
        query = query.eq('id', Number(filters.search));
      } else {
        // Search by client name or email
        query = query.or(
          `client_name.ilike.%${searchLower}%,client_email.ilike.%${searchLower}%`
        );
      }
    }

    // Apply pagination
    const from = ((filters.page || 1) - 1) * (filters.limit || 20);
    const to = from + (filters.limit || 20) - 1;
    query = query.range(from, to);

    // Order by scheduled datetime desc (most recent first)
    query = query.order('scheduled_datetime', { ascending: false });

    const { data: bookings, error: bookingsError, count } = await query;

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: bookingsError.message },
        { status: 500 }
      );
    }

    // Apply market filter (client-side filtering on joined data)
    let filteredBookings = bookings || [];
    if (filters.market_id) {
      filteredBookings = filteredBookings.filter((booking: any) => {
        return booking.contractor?.market_id === filters.market_id;
      });
    }

    // Transform data to match AdminBookingWithDetails interface
    const transformedBookings: AdminBookingWithDetails[] = filteredBookings.map((booking: any) => ({
      ...booking,
      client_profile: booking.client_profile,
      contractor_profile: booking.contractor_profile,
      service: booking.service,
      contractor: booking.contractor,
    }));

    // Update count to reflect filtered results
    const filteredCount = filters.market_id ? transformedBookings.length : (count || 0);

    return NextResponse.json({
      success: true,
      data: transformedBookings,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: filteredCount,
        total_pages: Math.ceil(filteredCount / (filters.limit || 20)),
      },
    });

  } catch (error) {
    console.error('❌ Unexpected error in GET /api/admin/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

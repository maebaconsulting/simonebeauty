import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contractors/available
 * Get available contractors for a specific service, date, and time
 *
 * Query params:
 * - service_id: number
 * - date: string (YYYY-MM-DD)
 * - time: string (HH:mm)
 * - address_id: number (optional - for distance calculation)
 *
 * SECURITY: Uses PostgreSQL FUNCTION with SECURITY DEFINER
 * This is secure because:
 * - Function is in database with controlled logic
 * - Returns only public contractor information
 * - Works with ANON_KEY (no Service Role Key needed)
 * - Compatible with web AND mobile apps (iOS, Android)
 */
export async function GET(request: NextRequest) {
  try {
    // Use regular client (ANON_KEY) - function has SECURITY DEFINER
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const serviceId = searchParams.get('service_id');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const addressId = searchParams.get('address_id');

    // Validate required parameters
    if (!serviceId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required parameters: service_id, date, time' },
        { status: 400 }
      );
    }

    console.log('[Available Contractors] Query:', { serviceId, date, time, addressId });

    // Call PostgreSQL function to get available contractors
    const { data: contractors, error } = await supabase.rpc('get_available_contractors', {
      p_service_id: parseInt(serviceId),
      p_date: date,
      p_time: time,
      p_address_id: addressId ? parseInt(addressId) : null,
    });

    if (error) {
      console.error('[Available Contractors] Error calling function:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contractors', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Available Contractors] Found:', contractors?.length || 0);

    // Get service details for response metadata
    const { data: service } = await supabase
      .from('services')
      .select('id, name, base_duration_minutes')
      .eq('id', serviceId)
      .single();

    // Calculate end time from service duration
    let endTime = time;
    if (service) {
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + service.base_duration_minutes);
      endTime = endDateTime.toTimeString().slice(0, 5);
    }

    // Transform database results to match API contract
    const formattedContractors = (contractors || []).map((c: any) => ({
      id: c.contractor_id,
      slug: c.contractor_slug,
      business_name: c.business_name,
      bio: c.bio,
      professional_title: c.professional_title,
      profile_picture_url: c.profile_picture_url,
      rating: c.rating,
      total_bookings: c.total_bookings,
      distance_km: c.distance_km,
      specialties: c.specialties || [],
      recommendation_score: null, // Calculated by assignment endpoint
    }));

    return NextResponse.json({
      contractors: formattedContractors,
      total: formattedContractors.length,
      service: service ? {
        id: service.id,
        name: service.name,
        duration_minutes: service.base_duration_minutes,
      } : null,
      timeslot: {
        date,
        start_time: time,
        end_time: endTime,
      },
    });

  } catch (error) {
    console.error('[Available Contractors] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

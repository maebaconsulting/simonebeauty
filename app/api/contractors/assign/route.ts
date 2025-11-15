import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contractors/assign
 * Intelligent contractor assignment algorithm
 *
 * Body:
 * - service_id: number
 * - date: string (YYYY-MM-DD)
 * - time: string (HH:mm)
 * - address_id: number (optional - for distance calculation)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { service_id, date, time, address_id } = body;

    // Validate required parameters
    if (!service_id || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required parameters: service_id, date, time' },
        { status: 400 }
      );
    }

    console.log('[Contractor Assignment] Starting assignment:', { service_id, date, time, address_id });

    // Get available contractors from the available API
    const availableUrl = new URL('/api/contractors/available', request.url);
    availableUrl.searchParams.set('service_id', service_id.toString());
    availableUrl.searchParams.set('date', date);
    availableUrl.searchParams.set('time', time);
    if (address_id) {
      availableUrl.searchParams.set('address_id', address_id.toString());
    }

    const availableResponse = await fetch(availableUrl.toString());
    const availableData = await availableResponse.json();

    if (!availableData.contractors || availableData.contractors.length === 0) {
      return NextResponse.json({
        recommended: null,
        alternatives: [],
        message: 'No contractors available for this time slot'
      });
    }

    console.log('[Contractor Assignment] Found', availableData.contractors.length, 'available contractors');

    // Calculate scores for each contractor
    const scoredContractors = await Promise.all(
      availableData.contractors.map(async (contractor: any) => {
        let score = 100; // Base score

        // 1. Get contractor's completed bookings count (workload/experience indicator)
        const { data: completedBookings } = await supabase
          .from('appointment_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('contractor_id', contractor.id)
          .eq('status', 'completed');

        const bookingsCount = completedBookings?.length || 0;
        contractor.total_bookings = bookingsCount;

        // Experience score: More bookings = better (up to +50 points)
        const experienceScore = Math.min(50, bookingsCount * 2);
        score += experienceScore;

        // 2. Calculate distance if address provided
        if (address_id) {
          const { data: address } = await supabase
            .from('client_addresses')
            .select('latitude, longitude')
            .eq('id', address_id)
            .single();

          if (address?.latitude && address?.longitude) {
            // For now, use a simple calculation
            // In production, you'd use Google Distance Matrix API or similar
            // For MVP, we'll prioritize contractors without specific distance penalty
            contractor.distance_km = null; // Placeholder

            // Distance score: Closer = better (placeholder for now)
            // score += 30; // Would be calculated based on actual distance
          }
        }

        // 3. Specialties match (if contractor specializes in this service)
        const service = await supabase
          .from('services')
          .select('category')
          .eq('id', service_id)
          .single();

        if (service.data && contractor.specialties?.includes(service.data.category)) {
          score += 20; // Specialty bonus
        }

        // 4. Rating placeholder (for future when ratings are implemented)
        contractor.rating = null; // Will be populated when rating system is implemented
        // score += (contractor.rating || 4) * 10; // Example: 5 stars = +50 points

        contractor.recommendation_score = score;
        return contractor;
      })
    );

    // Sort by score (highest first)
    scoredContractors.sort((a, b) => b.recommendation_score - a.recommendation_score);

    console.log('[Contractor Assignment] Scores:', scoredContractors.map(c => ({
      id: c.id,
      name: c.business_name,
      score: c.recommendation_score
    })));

    // Return recommended (highest score) + up to 3 alternatives
    const recommended = scoredContractors[0];
    const alternatives = scoredContractors.slice(1, 4); // Up to 3 alternatives

    return NextResponse.json({
      recommended,
      alternatives,
      total_available: scoredContractors.length,
      service: availableData.service,
      timeslot: availableData.timeslot,
    });

  } catch (error) {
    console.error('[Contractor Assignment] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

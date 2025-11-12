/**
 * API Routes: /api/admin/contractors/[code]
 * Feature: 018-international-market-segmentation
 *
 * GET /api/admin/contractors/[code] - Get contractor details by unique code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { contractorCodeSchema } from '@/lib/validations/code-schemas';
import { ZodError } from 'zod';

type RouteContext = {
  params: Promise<{ code: string }>;
};

/**
 * GET /api/admin/contractors/[code]
 * Get contractor details by unique code (CTR-XXXXXX)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check user role (admin or manager)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Validate contractor code parameter
    const { code: codeParam } = await context.params;
    const contractorCode = contractorCodeSchema.parse(codeParam);

    // Fetch contractor by code with market information
    const { data: contractor, error } = await supabase
      .from('contractors')
      .select(
        `
        *,
        market:markets (
          id,
          name,
          code,
          currency_code,
          timezone,
          supported_languages
        )
      `
      )
      .eq('contractor_code', contractorCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Prestataire non trouvé' },
          { status: 404 }
        );
      }
      throw new Error(
        `Erreur lors de la récupération du prestataire: ${error.message}`
      );
    }

    // Get total booking count
    const { count: bookingCount } = await supabase
      .from('appointment_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractor.id);

    // Get upcoming booking count (confirmed bookings with future dates)
    const { count: upcomingBookingCount } = await supabase
      .from('appointment_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractor.id)
      .eq('status', 'confirmed')
      .gte('scheduled_datetime', new Date().toISOString());

    // Get service count (services this contractor offers)
    const { count: serviceCount } = await supabase
      .from('contractor_services')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractor.id)
      .eq('is_active', true);

    return NextResponse.json({
      data: {
        ...contractor,
        _count: {
          bookings: bookingCount || 0,
          upcoming_bookings: upcomingBookingCount || 0,
          services: serviceCount || 0,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/admin/contractors/[code] error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Code prestataire invalide', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération du prestataire' },
      { status: 500 }
    );
  }
}

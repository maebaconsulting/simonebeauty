/**
 * API Routes: /api/admin/clients/[code]
 * Feature: 018-international-market-segmentation
 *
 * GET /api/admin/clients/[code] - Get client details by unique code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clientCodeSchema } from '@/lib/validations/code-schemas';
import { ZodError } from 'zod';

type RouteContext = {
  params: Promise<{ code: string }>;
};

/**
 * GET /api/admin/clients/[code]
 * Get client details by unique code (CLI-XXXXXX)
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

    // Validate client code parameter
    const { code: codeParam } = await context.params;
    const clientCode = clientCodeSchema.parse(codeParam);

    // Fetch client by code
    const { data: client, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('client_code', clientCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Client non trouvé' },
          { status: 404 }
        );
      }
      throw new Error(`Erreur lors de la récupération du client: ${error.message}`);
    }

    // Get booking and address counts
    const { count: bookingCount } = await supabase
      .from('appointment_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id);

    const { count: addressCount } = await supabase
      .from('client_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id);

    return NextResponse.json({
      data: {
        ...client,
        _count: {
          bookings: bookingCount || 0,
          addresses: addressCount || 0,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/admin/clients/[code] error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Code client invalide', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    );
  }
}

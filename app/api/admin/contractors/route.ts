/**
 * API Routes: /api/admin/contractors
 * Feature: 018-international-market-segmentation
 *
 * GET /api/admin/contractors - Search contractors by code, name, market
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchContractorsQuerySchema } from '@/lib/validations/code-schemas';
import { ZodError } from 'zod';

/**
 * GET /api/admin/contractors
 * Search and list contractors with pagination
 */
export async function GET(request: NextRequest) {
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

    // Check user role (admin or manager only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      search: searchParams.get('search'),
      market_id: searchParams.get('market_id'),
      is_active: searchParams.get('is_active'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sort: searchParams.get('sort') || 'created_at',
      order: searchParams.get('order') || 'desc',
    };

    const validated = searchContractorsQuerySchema.parse(queryParams);
    const offset = (validated.page - 1) * validated.limit;

    // Build query with market join
    let query = supabase
      .from('contractors')
      .select(
        `
        *,
        market:markets (
          id,
          name,
          code,
          currency_code
        )
      `,
        { count: 'exact' }
      )
      .not('contractor_code', 'is', null); // Only contractors with codes

    // Apply search filter (code or business name)
    if (validated.search) {
      const search = validated.search.trim();

      // Check if search looks like a code (CTR-XXXXXX)
      if (/^CTR-\d{0,6}$/.test(search)) {
        // Search by code (exact or partial match)
        query = query.ilike('contractor_code', `${search}%`);
      } else {
        // Search by business name
        query = query.ilike('business_name', `%${search}%`);
      }
    }

    // Apply market filter
    if (validated.market_id !== undefined) {
      query = query.eq('market_id', validated.market_id);
    }

    // Apply active status filter
    if (validated.is_active !== undefined) {
      query = query.eq('is_active', validated.is_active);
    }

    // Apply sorting
    query = query.order(validated.sort, {
      ascending: validated.order === 'asc',
    });

    // Apply pagination
    query = query.range(offset, offset + validated.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error(
        `Erreur lors de la récupération des prestataires: ${error.message}`
      );
    }

    const pages = Math.ceil((count || 0) / validated.limit);

    return NextResponse.json({
      data: data || [],
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total: count || 0,
        pages,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/contractors error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Paramètres de requête invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des prestataires' },
      { status: 500 }
    );
  }
}

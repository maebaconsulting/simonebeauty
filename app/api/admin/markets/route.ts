/**
 * API Routes: /api/admin/markets
 * Feature: 018-international-market-segmentation
 *
 * GET  /api/admin/markets - List markets with pagination
 * POST /api/admin/markets - Create a new market
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketRepository } from '@/lib/repositories/MarketRepository';
import {
  listMarketsQuerySchema,
  createMarketSchema,
} from '@/lib/validations/market-schemas';
import { ZodError } from 'zod';

/**
 * GET /api/admin/markets
 * List markets with pagination and filtering
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
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      is_active: searchParams.get('is_active') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || 'id',
      order: searchParams.get('order') || 'asc',
    };

    const validated = listMarketsQuerySchema.parse(queryParams);

    // Fetch markets from repository
    const { data, total } = await MarketRepository.list({
      page: validated.page,
      limit: validated.limit,
      filters: {
        is_active: validated.is_active,
        search: validated.search,
      },
      sort: {
        field: validated.sort,
        order: validated.order,
      },
    });

    const pages = Math.ceil(total / validated.limit);

    return NextResponse.json({
      data,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/markets error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Paramètres de requête invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des marchés' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/markets
 * Create a new market
 */
export async function POST(request: NextRequest) {
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

    // Check user role (admin only for market creation)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = createMarketSchema.parse(body);

    // Create market via repository
    const market = await MarketRepository.create(validated);

    return NextResponse.json({ data: market }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/markets error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check for specific business logic errors
      if (error.message.includes('existe déjà')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du marché' },
      { status: 500 }
    );
  }
}

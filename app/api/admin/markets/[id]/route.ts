/**
 * API Routes: /api/admin/markets/[id]
 * Feature: 018-international-market-segmentation
 *
 * GET    /api/admin/markets/[id] - Get market details with stats
 * PUT    /api/admin/markets/[id] - Update a market
 * DELETE /api/admin/markets/[id] - Soft delete (deactivate) a market
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketRepository } from '@/lib/repositories/MarketRepository';
import {
  marketIdSchema,
  updateMarketSchema,
} from '@/lib/validations/market-schemas';
import { ZodError } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/markets/[id]
 * Get market details with statistics
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    // Validate market ID parameter
    const { id: idParam } = await context.params;
    const marketId = marketIdSchema.parse(idParam);

    // Fetch market with stats
    const market = await MarketRepository.findByIdWithStats(marketId);

    if (!market) {
      return NextResponse.json(
        { error: 'Marché non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: market });
  } catch (error) {
    console.error('GET /api/admin/markets/[id] error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'ID marché invalide', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération du marché' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/markets/[id]
 * Update a market
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
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

    // Check user role (admin only for market updates)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Validate market ID parameter
    const { id: idParam } = await context.params;
    const marketId = marketIdSchema.parse(idParam);

    // Parse and validate request body
    const body = await request.json();
    const validated = updateMarketSchema.parse(body);

    // Update market via repository
    const market = await MarketRepository.update(marketId, validated);

    return NextResponse.json({ data: market });
  } catch (error) {
    console.error('PUT /api/admin/markets/[id] error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check for specific business logic errors
      if (error.message.includes('introuvable')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.message.includes('existe déjà')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du marché' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/markets/[id]
 * Soft delete (deactivate) a market
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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

    // Check user role (admin only for market deletion)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Validate market ID parameter
    const { id: idParam } = await context.params;
    const marketId = marketIdSchema.parse(idParam);

    // Check query param for hard delete
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete (permanent removal)
      await MarketRepository.hardDelete(marketId);
      return NextResponse.json({
        message: 'Marché supprimé définitivement',
      });
    } else {
      // Soft delete (deactivate)
      const market = await MarketRepository.softDelete(marketId);
      return NextResponse.json({
        data: market,
        message: 'Marché désactivé avec succès',
      });
    }
  } catch (error) {
    console.error('DELETE /api/admin/markets/[id] error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'ID marché invalide', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check for specific business logic errors
      if (error.message.includes('introuvable')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.message.includes('prestataire')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du marché' },
      { status: 500 }
    );
  }
}

/**
 * API Routes: /api/admin/clients
 * Feature: 018-international-market-segmentation
 *
 * GET /api/admin/clients - Search clients by code, name, email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchClientsQuerySchema } from '@/lib/validations/code-schemas';
import { ZodError } from 'zod';

/**
 * GET /api/admin/clients
 * Search and list clients with pagination
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
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sort: searchParams.get('sort') || 'created_at',
      order: searchParams.get('order') || 'desc',
    };

    const validated = searchClientsQuerySchema.parse(queryParams);
    const offset = (validated.page - 1) * validated.limit;

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .not('client_code', 'is', null); // Only clients with codes

    // Apply search filter (code, first_name, last_name)
    if (validated.search) {
      const search = validated.search.trim();

      // Check if search looks like a code (CLI-XXXXXX)
      if (/^CLI-\d{0,6}$/.test(search)) {
        // Search by code (exact or partial match)
        query = query.ilike('client_code', `${search}%`);
      } else {
        // Search by name (first_name or last_name)
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        );
      }
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
      throw new Error(`Erreur lors de la récupération des clients: ${error.message}`);
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
    console.error('GET /api/admin/clients error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Paramètres de requête invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    );
  }
}

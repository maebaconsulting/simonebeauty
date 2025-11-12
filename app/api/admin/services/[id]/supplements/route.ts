/**
 * API Route: Service Supplements Management
 * Feature: Service Supplements
 *
 * Manages supplements/add-ons for services (extended duration, additional products, options, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET: Fetch all supplements for a service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check admin/manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const serviceId = parseInt(params.id, 10)

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    // Fetch supplements for this service
    const { data: supplements, error } = await supabase
      .from('service_supplements')
      .select('*')
      .eq('service_id', serviceId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching service supplements:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des suppléments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ supplements: supplements || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/services/[id]/supplements:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Create a new supplement for a service
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check admin/manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const serviceId = parseInt(params.id, 10)

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      description,
      type,
      price_adjustment,
      duration_adjustment,
      is_active,
      display_order,
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name et type sont requis' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['duration', 'product', 'addon', 'option']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type invalide. Doit être: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get the next display order if not provided
    let nextDisplayOrder = display_order
    if (nextDisplayOrder === undefined) {
      const { data: maxOrder } = await supabase
        .from('service_supplements')
        .select('display_order')
        .eq('service_id', serviceId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      nextDisplayOrder = maxOrder ? (maxOrder.display_order || 0) + 1 : 0
    }

    // Create supplement
    const { data, error } = await supabase
      .from('service_supplements')
      .insert({
        service_id: serviceId,
        name,
        description: description || null,
        type,
        price_adjustment: price_adjustment || 0,
        duration_adjustment: duration_adjustment || 0,
        is_active: is_active !== undefined ? is_active : true,
        display_order: nextDisplayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service supplement:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du supplément' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/services/[id]/supplements:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT: Update a supplement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check admin/manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const serviceId = parseInt(params.id, 10)

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    const body = await request.json()
    const {
      supplement_id,
      name,
      description,
      type,
      price_adjustment,
      duration_adjustment,
      is_active,
      display_order,
    } = body

    if (!supplement_id) {
      return NextResponse.json({ error: 'supplement_id est requis' }, { status: 400 })
    }

    // Build updates object
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (type !== undefined) {
      const validTypes = ['duration', 'product', 'addon', 'option']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Type invalide. Doit être: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
      updates.type = type
    }
    if (price_adjustment !== undefined) updates.price_adjustment = price_adjustment
    if (duration_adjustment !== undefined) updates.duration_adjustment = duration_adjustment
    if (is_active !== undefined) updates.is_active = is_active
    if (display_order !== undefined) updates.display_order = display_order

    const { data, error } = await supabase
      .from('service_supplements')
      .update(updates)
      .eq('id', supplement_id)
      .eq('service_id', serviceId)
      .select()
      .single()

    if (error) {
      console.error('Error updating service supplement:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Supplément non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT /api/admin/services/[id]/supplements:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a supplement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check admin/manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const serviceId = parseInt(params.id, 10)

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'ID de service invalide' }, { status: 400 })
    }

    // Get supplement_id from query params
    const { searchParams } = new URL(request.url)
    const supplementId = searchParams.get('supplement_id')

    if (!supplementId) {
      return NextResponse.json({ error: 'supplement_id est requis' }, { status: 400 })
    }

    // Delete supplement
    const { error } = await supabase
      .from('service_supplements')
      .delete()
      .eq('id', parseInt(supplementId, 10))
      .eq('service_id', serviceId)

    if (error) {
      console.error('Error deleting service supplement:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/services/[id]/supplements:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

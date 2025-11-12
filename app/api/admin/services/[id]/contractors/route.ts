/**
 * API Route: Service Contractors Management
 * Feature: Service Contractors Association
 *
 * Manages associations between services and contractors
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET: Fetch all contractors associated with a service
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

    // Fetch contractor_services (without join to avoid PostgREST ambiguity)
    const { data: contractorServices, error: servicesError } = await supabase
      .from('contractor_services')
      .select(`
        id,
        contractor_id,
        is_active,
        custom_price,
        custom_duration,
        custom_description,
        added_at,
        updated_at
      `)
      .eq('service_id', serviceId)
      .order('added_at', { ascending: false })

    if (servicesError) {
      console.error('Error fetching contractor services:', servicesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des prestataires' },
        { status: 500 }
      )
    }

    if (!contractorServices || contractorServices.length === 0) {
      return NextResponse.json({ contractors: [] })
    }

    // Extract contractor IDs
    const contractorIds = contractorServices.map(cs => cs.contractor_id)

    // Fetch contractors details separately
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select(`
        id,
        business_name,
        professional_title,
        is_active
      `)
      .in('id', contractorIds)

    if (contractorsError) {
      console.error('Error fetching contractors:', contractorsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des détails des prestataires' },
        { status: 500 }
      )
    }

    // Merge data: attach contractor details to each contractor_service
    const contractorsMap = new Map(contractors?.map(c => [c.id, c]) || [])
    const enrichedData = contractorServices.map(cs => ({
      ...cs,
      contractors: contractorsMap.get(cs.contractor_id) || null,
    }))

    return NextResponse.json({ contractors: enrichedData })
  } catch (error) {
    console.error('Error in GET /api/admin/services/[id]/contractors:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Associate a contractor with a service
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
    const { contractor_id, custom_price, custom_duration, custom_description } = body

    if (!contractor_id) {
      return NextResponse.json({ error: 'contractor_id est requis' }, { status: 400 })
    }

    // Check if association already exists
    const { data: existing } = await supabase
      .from('contractor_services')
      .select('id')
      .eq('service_id', serviceId)
      .eq('contractor_id', contractor_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Ce prestataire est déjà associé à ce service' },
        { status: 409 }
      )
    }

    // Create association
    const { data, error } = await supabase
      .from('contractor_services')
      .insert({
        service_id: serviceId,
        contractor_id,
        is_active: true,
        custom_price: custom_price || null,
        custom_duration: custom_duration || null,
        custom_description: custom_description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contractor service association:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'association du prestataire' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/services/[id]/contractors:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT: Update a contractor-service association
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
      contractor_id,
      is_active,
      custom_price,
      custom_duration,
      custom_description,
    } = body

    if (!contractor_id) {
      return NextResponse.json({ error: 'contractor_id est requis' }, { status: 400 })
    }

    // Update association
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (is_active !== undefined) updates.is_active = is_active
    if (custom_price !== undefined) updates.custom_price = custom_price
    if (custom_duration !== undefined) updates.custom_duration = custom_duration
    if (custom_description !== undefined) updates.custom_description = custom_description

    const { data, error } = await supabase
      .from('contractor_services')
      .update(updates)
      .eq('service_id', serviceId)
      .eq('contractor_id', contractor_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contractor service association:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Association non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT /api/admin/services/[id]/contractors:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a contractor-service association
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

    // Get contractor_id from query params
    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractor_id')

    if (!contractorId) {
      return NextResponse.json({ error: 'contractor_id est requis' }, { status: 400 })
    }

    // Delete association
    const { error } = await supabase
      .from('contractor_services')
      .delete()
      .eq('service_id', serviceId)
      .eq('contractor_id', contractorId)

    if (error) {
      console.error('Error deleting contractor service association:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/services/[id]/contractors:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

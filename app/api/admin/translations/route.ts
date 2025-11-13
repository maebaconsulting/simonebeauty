import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin or manager role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { entityType, translations } = body

    if (!entityType || !translations || !Array.isArray(translations)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Upsert translations (insert or update)
    const translationRecords = translations.map((t) => ({
      entity_type: entityType,
      entity_id: t.entity_id,
      field_name: t.field_name,
      language_code: t.language_code,
      value: t.value,
      updated_at: new Date().toISOString(),
    }))

    // Use upsert to insert or update based on unique constraint
    // (entity_type, entity_id, field_name, language_code)
    const { error: upsertError } = await supabase
      .from('translations')
      .upsert(translationRecords, {
        onConflict: 'entity_type,entity_id,field_name,language_code',
      })

    if (upsertError) {
      console.error('Error upserting translations:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save translations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in translations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

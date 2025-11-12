import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * TEST ENDPOINT - Debug contractor data structure
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('contractor_services')
      .select(`
        contractor_id,
        contractors (
          id,
          slug,
          business_name,
          bio,
          professional_title,
          contractor_onboarding_status (
            is_completed
          )
        )
      `)
      .eq('service_id', 1)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return raw data structure for debugging
    return NextResponse.json({
      raw_data: data,
      data_length: data?.length || 0,
      first_contractor: data?.[0] || null,
      onboarding_status_type: data?.[0]?.contractors?.contractor_onboarding_status ?
        (Array.isArray(data[0].contractors.contractor_onboarding_status) ? 'array' : 'object') :
        'null',
      onboarding_status_value: data?.[0]?.contractors?.contractor_onboarding_status,
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

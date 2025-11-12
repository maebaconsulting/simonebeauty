import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/notifications
 * Fetch client notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('client_notification_preferences')
      .select('*')
      .eq('client_id', user.id)
      .single();

    if (preferencesError) {
      // If no preferences exist yet, create default ones
      if (preferencesError.code === 'PGRST116') {
        const { data: newPreferences, error: createError } = await supabase
          .from('client_notification_preferences')
          .insert({ client_id: user.id })
          .select()
          .single();

        if (createError) {
          console.error('Error creating default preferences:', createError);
          return NextResponse.json(
            { error: 'Failed to create default preferences' },
            { status: 500 }
          );
        }

        return NextResponse.json({ preferences: newPreferences });
      }

      console.error('Error fetching preferences:', preferencesError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Unexpected error in GET /api/client/notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/client/notifications
 * Update client notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate reminder_hours_before if provided
    if (
      body.reminder_hours_before !== undefined &&
      ![1, 2, 6, 12, 24, 48].includes(body.reminder_hours_before)
    ) {
      return NextResponse.json(
        { error: 'Invalid reminder_hours_before value. Must be one of: 1, 2, 6, 12, 24, 48' },
        { status: 400 }
      );
    }

    // Validate quiet hours if provided
    if (body.quiet_hours_start && body.quiet_hours_end) {
      // Validate time format (HH:MM:SS or HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (
        !timeRegex.test(body.quiet_hours_start) ||
        !timeRegex.test(body.quiet_hours_end)
      ) {
        return NextResponse.json(
          { error: 'Invalid time format for quiet hours. Use HH:MM or HH:MM:SS' },
          { status: 400 }
        );
      }
    }

    // Filter allowed fields
    const allowedFields = [
      'email_enabled',
      'email_booking_confirmation',
      'email_booking_reminder',
      'email_booking_cancellation',
      'email_contractor_assignment',
      'email_marketing',
      'sms_enabled',
      'sms_booking_confirmation',
      'sms_booking_reminder',
      'sms_booking_cancellation',
      'sms_contractor_assignment',
      'push_enabled',
      'push_booking_confirmation',
      'push_booking_reminder',
      'push_booking_cancellation',
      'push_contractor_assignment',
      'reminder_hours_before',
      'quiet_hours_enabled',
      'quiet_hours_start',
      'quiet_hours_end',
      'timezone',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update preferences
    const { data: updatedPreferences, error: updateError } = await supabase
      .from('client_notification_preferences')
      .update(updateData)
      .eq('client_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/client/notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

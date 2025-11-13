import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBookingCancellationSMS } from '@/lib/twilio/sms-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/bookings/[id]
 * Fetch a specific booking detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = parseInt(params.id)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    }

    // Fetch booking with related service data only
    // Note: appointment_bookings has embedded address/contractor data (denormalized)
    const { data: booking, error } = await supabase
      .from('appointment_bookings')
      .select(`
        *,
        services:service_id (
          id,
          name,
          description,
          base_duration_minutes,
          base_price
        )
      `)
      .eq('id', bookingId)
      .eq('client_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching booking:', error)
      return NextResponse.json(
        { error: 'Failed to fetch booking' },
        { status: 500 }
      )
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Transform to match expected format
    const transformedBooking = {
      ...booking,
      // Map embedded address data to address object for consistency
      address: {
        street: booking.service_address,
        city: booking.service_city,
        postal_code: booking.service_postal_code,
      },
      // Contractor info if assigned
      contractor: booking.contractor_id
        ? {
            id: booking.contractor_id,
            name: booking.contractor_name || 'Prestataire',
          }
        : null,
    }

    return NextResponse.json({ booking: transformedBooking })
  } catch (error) {
    console.error('Error in booking GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/client/bookings/[id]
 * Cancel a booking
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = parseInt(params.id)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'cancel') {
      // Fetch complete booking details for SMS notification
      const { data: booking } = await supabase
        .from('appointment_bookings')
        .select(`
          *,
          services:service_id (name),
          contractors:contractor_id (
            contractor_profiles!inner (
              business_name,
              profiles!inner (first_name, last_name)
            )
          )
        `)
        .eq('id', bookingId)
        .eq('client_id', user.id)
        .single()

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      if (booking.status === 'cancelled' || booking.status === 'completed') {
        return NextResponse.json(
          { error: `Cannot cancel ${booking.status} booking` },
          { status: 400 }
        )
      }

      const scheduledTime = new Date(booking.scheduled_at)
      const now = new Date()
      const hoursDiff = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursDiff < 24) {
        return NextResponse.json(
          { error: 'Cannot cancel booking less than 24 hours before scheduled time' },
          { status: 400 }
        )
      }

      // Cancel the booking
      const { data: updatedBooking, error } = await supabase
        .from('appointment_bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('client_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error cancelling booking:', error)
        return NextResponse.json(
          { error: 'Failed to cancel booking' },
          { status: 500 }
        )
      }

      // Send cancellation SMS notification
      try {
        // Get client's phone number
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single()

        if (profile?.phone) {
          const contractorProfiles = Array.isArray(booking.contractors?.contractor_profiles)
            ? booking.contractors.contractor_profiles[0]
            : booking.contractors?.contractor_profiles

          const contractorName = contractorProfiles?.business_name ||
            `${contractorProfiles?.profiles?.first_name || ''} ${contractorProfiles?.profiles?.last_name || ''}`.trim()

          const scheduledDate = new Date(booking.scheduled_at)
          const dateStr = scheduledDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          const timeStr = scheduledDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })

          await sendBookingCancellationSMS(user.id, profile.phone, {
            serviceName: booking.services?.name || 'Service',
            contractorName: contractorName || 'Professionnel',
            date: dateStr,
            time: timeStr,
          })
        }
      } catch (smsError) {
        // Log error but don't fail the cancellation
        console.error('Error sending cancellation SMS:', smsError)
      }

      return NextResponse.json({ booking: updatedBooking })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in booking PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

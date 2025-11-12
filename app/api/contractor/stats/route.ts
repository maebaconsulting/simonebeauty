/**
 * Contractor Statistics API
 * Feature: 007-contractor-interface
 * Route: GET /api/contractor/stats
 *
 * Returns key metrics for contractor dashboard:
 * - Pending booking requests count
 * - Today's bookings count
 * - Month revenue total
 * - Profile completion percentage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify contractor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'contractor') {
      return NextResponse.json({ error: 'Forbidden - Contractor access only' }, { status: 403 })
    }

    // Get contractor_id from contractors table
    const { data: contractor } = await supabase
      .from('contractors')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 })
    }

    const contractorId = contractor.id

    // 1. Count pending booking requests
    const { count: pendingRequestsCount } = await supabase
      .from('booking_requests')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractorId)
      .eq('status', 'pending')

    // 2. Count today's bookings
    // Get today's date range in Paris timezone
    const parisNow = new Date().toLocaleString('en-CA', { timeZone: 'Europe/Paris', dateStyle: 'short' })
    const todayStart = new Date(parisNow + ' 00:00:00').toISOString()
    const todayEnd = new Date(parisNow + ' 23:59:59').toISOString()

    const { count: todayBookingsCount } = await supabase
      .from('appointment_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractorId)
      .gte('scheduled_datetime', todayStart)
      .lte('scheduled_datetime', todayEnd)
      .in('status', ['confirmed', 'in_progress'])

    // 3. Calculate month revenue
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: completedBookings } = await supabase
      .from('appointment_bookings')
      .select('service_amount')
      .eq('contractor_id', contractorId)
      .in('status', ['completed'])
      .gte('completed_at', firstDayOfMonth)
      .lte('completed_at', lastDayOfMonth)

    const monthRevenue = completedBookings?.reduce((sum, booking) => sum + (booking.service_amount || 0), 0) || 0

    // 4. Calculate profile completion
    const { data: contractorProfile } = await supabase
      .from('contractor_profiles')
      .select('bio, certifications, experience_years, hourly_rate')
      .eq('contractor_id', contractorId)
      .single()

    const { data: contractorServices } = await supabase
      .from('contractor_services')
      .select('id')
      .eq('contractor_id', contractorId)

    const { data: contractorSchedule } = await supabase
      .from('contractor_schedules')
      .select('id')
      .eq('contractor_id', contractorId)

    // Profile completion calculation (0-100%)
    let completionScore = 0
    const checks = [
      profile?.first_name, // From profiles table
      profile?.last_name,
      contractorProfile?.bio,
      contractorProfile?.experience_years,
      contractorProfile?.hourly_rate && contractorProfile.hourly_rate > 0,
      contractorServices && contractorServices.length > 0,
      contractorSchedule && contractorSchedule.length > 0,
    ]

    completionScore = Math.round((checks.filter(Boolean).length / checks.length) * 100)

    // Return statistics
    return NextResponse.json({
      success: true,
      data: {
        pending_requests: pendingRequestsCount || 0,
        today_bookings: todayBookingsCount || 0,
        month_revenue: monthRevenue,
        profile_completion: completionScore,
      },
    })
  } catch (error) {
    console.error('Error fetching contractor stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

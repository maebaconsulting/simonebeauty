/**
 * Send Booking Reminders Edge Function
 * Task: T-SMS-001
 * Feature: 007-contractor-interface / SMS Notifications
 *
 * Scheduled cron job that sends SMS reminders to clients:
 * - Runs hourly
 * - Finds bookings scheduled in the next 24 hours (configurable per client)
 * - Sends SMS reminders to clients with SMS notifications enabled
 * - Respects quiet hours preferences
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Check if current time is within quiet hours
 */
function isWithinQuietHours(
  quietHoursStart: string | null,
  quietHoursEnd: string | null,
  timezone: string
): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false

  try {
    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    })

    // Simple time comparison (HH:MM format)
    const current = currentTime.replace(':', '')
    const start = quietHoursStart.substring(0, 5).replace(':', '')
    const end = quietHoursEnd.substring(0, 5).replace(':', '')

    if (start <= end) {
      return current >= start && current <= end
    } else {
      // Quiet hours span midnight
      return current >= start || current <= end
    }
  } catch {
    return false
  }
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Twilio credentials not configured')
      return false
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const formData = new URLSearchParams()
    formData.append('To', to)
    formData.append('From', twilioPhoneNumber)
    formData.append('Body', message)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      console.error('Twilio API error:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const now = new Date()
    console.log(`⏰ Running booking reminder job at ${now.toISOString()}`)

    // Fetch all confirmed bookings
    const { data: bookings, error: bookingsError } = await supabaseClient
      .from('appointment_bookings')
      .select(`
        id,
        scheduled_datetime,
        client_id,
        services:service_id (name),
        addresses:address_id (street, city, postal_code),
        contractors:contractor_id (
          contractor_profiles!inner (
            business_name,
            profiles!inner (first_name, last_name)
          )
        ),
        clients:client_id (phone)
      `)
      .eq('status', 'confirmed')
      .gte('scheduled_datetime', now.toISOString())

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!bookings || bookings.length === 0) {
      console.log('No confirmed bookings found')
      return new Response(
        JSON.stringify({ message: 'No bookings to process', reminders_sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${bookings.length} confirmed bookings`)

    let remindersSent = 0
    let remindersSkipped = 0

    // Process each booking
    for (const booking of bookings) {
      try {
        // Fetch notification preferences
        const { data: preferences } = await supabaseClient
          .from('client_notification_preferences')
          .select('*')
          .eq('client_id', booking.client_id)
          .single()

        // Check if SMS reminders are enabled
        if (!preferences?.sms_enabled || !preferences?.sms_booking_reminder) {
          console.log(`Skipping booking ${booking.id}: SMS reminders disabled`)
          remindersSkipped++
          continue
        }

        // Check quiet hours
        if (preferences.quiet_hours_enabled) {
          const inQuietHours = isWithinQuietHours(
            preferences.quiet_hours_start,
            preferences.quiet_hours_end,
            preferences.timezone
          )
          if (inQuietHours) {
            console.log(`Skipping booking ${booking.id}: Within quiet hours`)
            remindersSkipped++
            continue
          }
        }

        // Calculate time until booking (scheduled_datetime is in UTC)
        const scheduledTime = new Date(booking.scheduled_datetime)
        const hoursUntilBooking = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        // Get reminder threshold (default 24 hours)
        const reminderHoursBefore = preferences.reminder_hours_before || 24

        // Check if we should send reminder
        // Send if booking is between (reminderHoursBefore) and (reminderHoursBefore - 1) hours away
        if (hoursUntilBooking >= reminderHoursBefore - 1 && hoursUntilBooking <= reminderHoursBefore) {
          // Check if reminder was already sent
          const { data: existingReminder } = await supabaseClient
            .from('service_action_logs')
            .select('id')
            .eq('booking_id', booking.id)
            .eq('action_type', 'reminder_sent')
            .single()

          if (existingReminder) {
            console.log(`Skipping booking ${booking.id}: Reminder already sent`)
            remindersSkipped++
            continue
          }

          // Get client phone
          const clientPhone = booking.clients?.phone
          if (!clientPhone) {
            console.log(`Skipping booking ${booking.id}: No client phone number`)
            remindersSkipped++
            continue
          }

          // Format booking details
          const contractorProfiles = Array.isArray(booking.contractors?.contractor_profiles)
            ? booking.contractors.contractor_profiles[0]
            : booking.contractors?.contractor_profiles

          const contractorName = contractorProfiles?.business_name ||
            `${contractorProfiles?.profiles?.first_name || ''} ${contractorProfiles?.profiles?.last_name || ''}`.trim()

          // Format datetime in Paris timezone (Europe/Paris)
          const dateStr = scheduledTime.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/Paris',
          })
          const timeStr = scheduledTime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris',
          })

          const address = booking.addresses
            ? `${booking.addresses.street}, ${booking.addresses.city}`
            : 'Adresse non spécifiée'

          const message = `Rappel: Votre rendez-vous est demain!

Service: ${booking.services?.name || 'Service'}
Professionnel: ${contractorName || 'Professionnel'}
Date: ${dateStr} à ${timeStr}
Adresse: ${address}

À très bientôt!
Simone Paris`

          // Send SMS
          const smsSent = await sendSMS(clientPhone, message)

          if (smsSent) {
            // Log the reminder
            await supabaseClient
              .from('service_action_logs')
              .insert({
                booking_id: booking.id,
                action_type: 'reminder_sent',
                action_details: {
                  reminder_type: 'sms',
                  hours_before: reminderHoursBefore,
                  sent_at: now.toISOString(),
                },
              })

            remindersSent++
            console.log(`✅ Reminder sent for booking ${booking.id}`)
          } else {
            console.error(`❌ Failed to send reminder for booking ${booking.id}`)
          }
        } else {
          console.log(`Skipping booking ${booking.id}: Not yet time for reminder (${hoursUntilBooking.toFixed(1)}h until booking)`)
          remindersSkipped++
        }
      } catch (bookingError) {
        console.error(`Error processing booking ${booking.id}:`, bookingError)
      }
    }

    console.log(`📊 Reminders sent: ${remindersSent}, Skipped: ${remindersSkipped}`)

    return new Response(
      JSON.stringify({
        message: 'Booking reminders processed',
        reminders_sent: remindersSent,
        reminders_skipped: remindersSkipped,
        total_bookings: bookings.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

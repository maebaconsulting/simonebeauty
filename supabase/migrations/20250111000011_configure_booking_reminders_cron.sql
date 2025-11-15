/**
 * Configure Cron Job for Sending Booking Reminders
 * Task: T-SMS-002
 * Feature: 007-contractor-interface / SMS Notifications
 *
 * Sets up hourly cron job to send SMS reminders to clients
 * Runs send-booking-reminders Edge Function every hour
 */

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Remove existing job if it exists (to allow re-running migration)
SELECT cron.unschedule('send-booking-reminders');

-- Schedule hourly job to send booking reminders
-- Runs every hour at 30 minutes past the hour (offset from expire-requests job)
SELECT cron.schedule(
  'send-booking-reminders', -- Job name
  '30 * * * *', -- Cron expression: every hour at minute 30
  $$
  SELECT
    net.http_post(
      url := 'https://xpntvajwrjuvsqsmizzb.supabase.co/functions/v1/send-booking-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'send-booking-reminders';

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL that runs inside the database';

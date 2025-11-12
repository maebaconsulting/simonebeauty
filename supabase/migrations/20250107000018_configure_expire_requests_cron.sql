/**
 * Configure Cron Job for Expiring Pending Requests
 * Task: T075
 * Feature: 007-contractor-interface
 *
 * Sets up hourly cron job to automatically expire pending booking requests
 * Runs expire-pending-requests Edge Function every hour
 */

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Remove existing job if it exists (to allow re-running migration)
SELECT cron.unschedule('expire-pending-booking-requests');

-- Schedule hourly job to expire pending requests
-- Runs every hour at the top of the hour (0 minutes)
SELECT cron.schedule(
  'expire-pending-booking-requests', -- Job name
  '0 * * * *', -- Cron expression: every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://xpntvajwrjuvsqsmizzb.supabase.co/functions/v1/expire-pending-requests',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'expire-pending-booking-requests';

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL that runs inside the database';

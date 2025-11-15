-- Migration: 20250111000030_add_timezone_columns.sql
-- Feature: 016-timezone-management
-- Description: Add TIMESTAMPTZ columns to appointment_bookings for proper timezone handling
-- Date: 2025-11-10
-- Phase: 1 - Database Migration (Step 1/4)

-- =============================================================================
-- ADD TIMEZONE COLUMNS TO appointment_bookings
-- =============================================================================

-- Add scheduled_datetime column (TIMESTAMPTZ for timezone-aware storage)
ALTER TABLE appointment_bookings
ADD COLUMN IF NOT EXISTS scheduled_datetime TIMESTAMPTZ;

-- Add booking_timezone column to store the timezone context
ALTER TABLE appointment_bookings
ADD COLUMN IF NOT EXISTS booking_timezone VARCHAR(50) DEFAULT 'Europe/Paris';

-- Add comment explaining the new columns
COMMENT ON COLUMN appointment_bookings.scheduled_datetime IS 'Timezone-aware timestamp for booking (UTC storage, Europe/Paris context). Replaces scheduled_date + scheduled_time.';
COMMENT ON COLUMN appointment_bookings.booking_timezone IS 'IANA timezone identifier for the booking (default: Europe/Paris for France)';

-- Create index on scheduled_datetime for performance
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_scheduled_datetime
ON appointment_bookings(scheduled_datetime)
WHERE scheduled_datetime IS NOT NULL;

-- =============================================================================
-- BACKWARD COMPATIBILITY NOTES
-- =============================================================================
--
-- The old columns (scheduled_date, scheduled_time) are kept temporarily:
-- - They will remain in the schema for 1 month as a rollback mechanism
-- - Migration script (next migration) will populate scheduled_datetime from them
-- - After 1 month of stable operation, they will be dropped (separate migration)
--
-- This allows safe rollback if any critical issues are discovered post-deployment.
-- =============================================================================

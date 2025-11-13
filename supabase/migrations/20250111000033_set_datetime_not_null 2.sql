-- Migration: 20250111000033_set_datetime_not_null.sql
-- Feature: 016-timezone-management
-- Description: Make scheduled_datetime column NOT NULL after successful data migration
-- Date: 2025-11-10
-- Phase: 1 - Database Migration (Step 4/4)
-- IMPORTANT: Only run this AFTER verifying 20250111000032_migrate_booking_times.sql succeeded

-- =============================================================================
-- PRE-MIGRATION VALIDATION
-- =============================================================================

DO $$
DECLARE
  v_null_count BIGINT;
  v_total_count BIGINT;
  v_failed_count BIGINT;
BEGIN
  -- Check if there are any bookings with NULL scheduled_datetime
  SELECT
    COUNT(*) FILTER (WHERE scheduled_datetime IS NULL),
    COUNT(*)
  INTO v_null_count, v_total_count
  FROM appointment_bookings;

  -- Check if there were any failed migrations
  SELECT COUNT(*)
  INTO v_failed_count
  FROM timezone_migration_log
  WHERE migration_status = 'failed';

  -- Log the current state
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'PRE-VALIDATION: Setting scheduled_datetime to NOT NULL';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Total bookings: %', v_total_count;
  RAISE NOTICE 'Bookings with NULL scheduled_datetime: %', v_null_count;
  RAISE NOTICE 'Failed migrations: %', v_failed_count;
  RAISE NOTICE '=============================================================================';

  -- Fail if there are still NULL values
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Cannot set scheduled_datetime to NOT NULL: % bookings still have NULL values. Run migration 20250111000032 first.', v_null_count;
  END IF;

  -- Fail if there were failed migrations
  IF v_failed_count > 0 THEN
    RAISE EXCEPTION 'Cannot proceed: % bookings failed to migrate. Review timezone_migration_log and fix manually.', v_failed_count;
  END IF;

  RAISE NOTICE 'Validation passed! All bookings have been successfully migrated.';
END $$;

-- =============================================================================
-- SET NOT NULL CONSTRAINT
-- =============================================================================

-- Make scheduled_datetime NOT NULL
ALTER TABLE appointment_bookings
ALTER COLUMN scheduled_datetime SET NOT NULL;

-- Update column comment
COMMENT ON COLUMN appointment_bookings.scheduled_datetime IS 'Timezone-aware timestamp for booking (UTC storage, Europe/Paris context). NOT NULL after migration. Replaces scheduled_date + scheduled_time.';

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'The scheduled_datetime column is now NOT NULL.';
  RAISE NOTICE 'All existing bookings have been migrated to timezone-aware format.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update application code to use scheduled_datetime instead of scheduled_date + scheduled_time';
  RAISE NOTICE '2. Deploy updated Edge Functions';
  RAISE NOTICE '3. Deploy updated frontend';
  RAISE NOTICE '4. Monitor for 1 month before dropping old columns (scheduled_date, scheduled_time)';
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- FUTURE CLEANUP (Run after 1 month of stable operation)
-- =============================================================================
-- After confirming everything works correctly for 1 month, you can:
--
-- 1. Drop the old columns:
--    ALTER TABLE appointment_bookings DROP COLUMN scheduled_date;
--    ALTER TABLE appointment_bookings DROP COLUMN scheduled_time;
--
-- 2. Clean up migration log:
--    DROP VIEW IF EXISTS migration_stats;
--    DROP FUNCTION IF EXISTS get_failed_migrations();
--    DROP TABLE IF EXISTS timezone_migration_log;
--
-- These will be in a separate migration: 20250211000034_drop_old_time_columns.sql
-- =============================================================================

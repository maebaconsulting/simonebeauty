-- Migration: 20250111000032_migrate_booking_times.sql
-- Feature: 016-timezone-management
-- Description: Migrate existing booking times from DATE+TIME to TIMESTAMPTZ format
-- Date: 2025-11-10
-- Phase: 1 - Database Migration (Step 3/4)
-- CRITICAL: This migration converts all existing booking data to timezone-aware format

-- =============================================================================
-- MIGRATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION migrate_booking_times_to_timestamptz()
RETURNS TABLE (
  total_bookings BIGINT,
  migrated_success BIGINT,
  migrated_failed BIGINT,
  migrated_skipped BIGINT
) AS $$
DECLARE
  v_booking RECORD;
  v_total BIGINT := 0;
  v_success BIGINT := 0;
  v_failed BIGINT := 0;
  v_skipped BIGINT := 0;
  v_scheduled_datetime TIMESTAMPTZ;
BEGIN
  -- Loop through all bookings that need migration
  FOR v_booking IN
    SELECT
      id,
      scheduled_date,
      scheduled_time
    FROM appointment_bookings
    WHERE scheduled_datetime IS NULL  -- Only migrate rows not yet processed
  LOOP
    v_total := v_total + 1;

    BEGIN
      -- Check if we have valid data
      IF v_booking.scheduled_date IS NULL OR v_booking.scheduled_time IS NULL THEN
        -- Skip rows with null values
        v_skipped := v_skipped + 1;

        INSERT INTO timezone_migration_log (
          booking_id,
          old_scheduled_date,
          old_scheduled_time,
          new_scheduled_datetime,
          migration_status,
          error_message
        ) VALUES (
          v_booking.id,
          v_booking.scheduled_date,
          v_booking.scheduled_time,
          NULL,
          'skipped',
          'scheduled_date or scheduled_time is NULL'
        );

        CONTINUE;
      END IF;

      -- Combine date and time, then convert to Europe/Paris timezone
      -- This creates a timestamp AT TIME ZONE, which PostgreSQL stores as TIMESTAMPTZ
      v_scheduled_datetime := (v_booking.scheduled_date + v_booking.scheduled_time)::timestamp AT TIME ZONE 'Europe/Paris';

      -- Update the booking with the new timezone-aware datetime
      UPDATE appointment_bookings
      SET
        scheduled_datetime = v_scheduled_datetime,
        booking_timezone = 'Europe/Paris'
      WHERE id = v_booking.id;

      -- Log successful migration
      v_success := v_success + 1;

      INSERT INTO timezone_migration_log (
        booking_id,
        old_scheduled_date,
        old_scheduled_time,
        new_scheduled_datetime,
        migration_status,
        error_message
      ) VALUES (
        v_booking.id,
        v_booking.scheduled_date,
        v_booking.scheduled_time,
        v_scheduled_datetime,
        'success',
        NULL
      );

    EXCEPTION
      WHEN OTHERS THEN
        -- Log failed migration
        v_failed := v_failed + 1;

        INSERT INTO timezone_migration_log (
          booking_id,
          old_scheduled_date,
          old_scheduled_time,
          new_scheduled_datetime,
          migration_status,
          error_message
        ) VALUES (
          v_booking.id,
          v_booking.scheduled_date,
          v_booking.scheduled_time,
          NULL,
          'failed',
          SQLERRM
        );
    END;
  END LOOP;

  -- Return summary statistics
  RETURN QUERY SELECT v_total, v_success, v_failed, v_skipped;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_booking_times_to_timestamptz() IS 'Migrate all existing booking times from scheduled_date+scheduled_time to scheduled_datetime (TIMESTAMPTZ)';

-- =============================================================================
-- RUN THE MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_result RECORD;
BEGIN
  -- Execute the migration function
  SELECT * FROM migrate_booking_times_to_timestamptz() INTO v_result;

  -- Log the results
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'TIMEZONE MIGRATION COMPLETED';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Total bookings processed: %', v_result.total_bookings;
  RAISE NOTICE 'Successfully migrated: %', v_result.migrated_success;
  RAISE NOTICE 'Failed migrations: %', v_result.migrated_failed;
  RAISE NOTICE 'Skipped (null values): %', v_result.migrated_skipped;
  RAISE NOTICE '=============================================================================';

  -- Fail the migration if there are any failures (requires manual intervention)
  IF v_result.migrated_failed > 0 THEN
    RAISE EXCEPTION 'Migration completed with % failures. Review timezone_migration_log for details.', v_result.migrated_failed;
  END IF;

  -- Warn if there are skipped rows
  IF v_result.migrated_skipped > 0 THEN
    RAISE WARNING '% bookings were skipped due to null values. Review timezone_migration_log for details.', v_result.migrated_skipped;
  END IF;

  RAISE NOTICE 'Migration successful! All bookings have been migrated to timezone-aware format.';
END $$;

-- =============================================================================
-- VERIFICATION QUERIES (Run manually after migration)
-- =============================================================================

-- 1. Check migration statistics
-- SELECT * FROM migration_stats;

-- 2. Compare counts
-- SELECT
--   COUNT(*) FILTER (WHERE scheduled_datetime IS NOT NULL) as migrated_count,
--   COUNT(*) FILTER (WHERE scheduled_datetime IS NULL) as not_migrated_count,
--   COUNT(*) as total_count
-- FROM appointment_bookings;

-- 3. Spot-check some migrated bookings
-- SELECT
--   id,
--   scheduled_date,
--   scheduled_time,
--   scheduled_datetime,
--   booking_timezone,
--   -- Verify the datetime matches the original date+time
--   (scheduled_datetime AT TIME ZONE 'Europe/Paris')::date as converted_date,
--   (scheduled_datetime AT TIME ZONE 'Europe/Paris')::time as converted_time
-- FROM appointment_bookings
-- WHERE scheduled_datetime IS NOT NULL
-- ORDER BY scheduled_datetime DESC
-- LIMIT 10;

-- 4. Check for any failures
-- SELECT * FROM get_failed_migrations();

-- =============================================================================
-- ROLLBACK PROCEDURE (In case of emergency)
-- =============================================================================
-- If you need to rollback this migration:
--
-- 1. Set scheduled_datetime back to NULL:
--    UPDATE appointment_bookings SET scheduled_datetime = NULL, booking_timezone = 'Europe/Paris';
--
-- 2. Clear the migration log:
--    TRUNCATE timezone_migration_log;
--
-- 3. Re-run this migration after fixing issues
-- =============================================================================

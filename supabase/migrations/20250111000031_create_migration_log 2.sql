-- Migration: 20250111000031_create_migration_log.sql
-- Feature: 016-timezone-management
-- Description: Create timezone_migration_log table to track data migration success/failures
-- Date: 2025-11-10
-- Phase: 1 - Database Migration (Step 2/4)

-- =============================================================================
-- CREATE MIGRATION LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS timezone_migration_log (
  id BIGSERIAL PRIMARY KEY,

  -- Reference to the booking being migrated
  booking_id BIGINT REFERENCES appointment_bookings(id) ON DELETE SET NULL,

  -- Old values (for rollback if needed)
  old_scheduled_date DATE,
  old_scheduled_time TIME,

  -- New value after migration
  new_scheduled_datetime TIMESTAMPTZ,

  -- Migration status tracking
  migration_status VARCHAR(20) NOT NULL CHECK (migration_status IN ('success', 'failed', 'skipped')),
  error_message TEXT,

  -- Audit fields
  migrated_at TIMESTAMP DEFAULT NOW(),
  migrated_by VARCHAR(100) DEFAULT 'system'
);

-- Indexes for performance
CREATE INDEX idx_migration_log_booking_id ON timezone_migration_log(booking_id);
CREATE INDEX idx_migration_log_status ON timezone_migration_log(migration_status);
CREATE INDEX idx_migration_log_migrated_at ON timezone_migration_log(migrated_at);

-- Comments
COMMENT ON TABLE timezone_migration_log IS 'Log table tracking the migration of booking times from DATE+TIME to TIMESTAMPTZ format';
COMMENT ON COLUMN timezone_migration_log.booking_id IS 'Reference to the appointment_bookings row being migrated';
COMMENT ON COLUMN timezone_migration_log.old_scheduled_date IS 'Original scheduled_date value before migration';
COMMENT ON COLUMN timezone_migration_log.old_scheduled_time IS 'Original scheduled_time value before migration';
COMMENT ON COLUMN timezone_migration_log.new_scheduled_datetime IS 'New scheduled_datetime value after migration (timezone-aware)';
COMMENT ON COLUMN timezone_migration_log.migration_status IS 'Status: success (migrated ok), failed (error during migration), skipped (null values)';
COMMENT ON COLUMN timezone_migration_log.error_message IS 'Error details if migration_status = failed';

-- =============================================================================
-- HELPER VIEW: Migration Statistics
-- =============================================================================

CREATE OR REPLACE VIEW migration_stats AS
SELECT
  migration_status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM timezone_migration_log
GROUP BY migration_status
ORDER BY count DESC;

COMMENT ON VIEW migration_stats IS 'Summary statistics for timezone migration (success rate, failures, etc)';

-- =============================================================================
-- HELPER FUNCTION: Get Failed Migrations
-- =============================================================================

CREATE OR REPLACE FUNCTION get_failed_migrations()
RETURNS TABLE (
  booking_id BIGINT,
  old_date DATE,
  old_time TIME,
  error TEXT,
  migrated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tml.booking_id,
    tml.old_scheduled_date,
    tml.old_scheduled_time,
    tml.error_message,
    tml.migrated_at
  FROM timezone_migration_log tml
  WHERE tml.migration_status = 'failed'
  ORDER BY tml.migrated_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_failed_migrations() IS 'Helper function to retrieve all failed migration entries for debugging';

-- Migration: 20250107115958_clean_services_table.sql
-- Feature: Clean services table before seeding
-- Description: Remove any test/existing services to prepare for the 88 production services
-- Date: 2025-11-07

-- Delete all existing services (if any)
-- This is safe because:
-- 1. We're in development/initial setup phase
-- 2. No real bookings exist yet
-- 3. We're about to insert the definitive 88 services

TRUNCATE TABLE services CASCADE;

-- Reset the sequence to start at 1
ALTER SEQUENCE services_id_seq RESTART WITH 1;

-- Log the action
DO $$
BEGIN
  RAISE NOTICE '✅ Services table cleaned and ready for seeding 88 production services';
END $$;

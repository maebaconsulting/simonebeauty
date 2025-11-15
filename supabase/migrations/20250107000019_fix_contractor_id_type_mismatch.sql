/**
 * Fix contractor_id Type Mismatch
 * Task: Fix critical type error preventing contractor approvals
 * Feature: 007-contractor-interface
 *
 * Problem: contractors.id is UUID, but all child tables use contractor_id BIGINT
 * This causes INSERT failures when trying to create contractor profiles
 *
 * Solution: Convert all contractor_id columns from BIGINT to UUID
 */

-- Step 1: Drop views that depend on contractor_id
DROP VIEW IF EXISTS contractor_slug_stats;

-- Step 2: Drop ALL RLS policies that depend on contractor_id
DROP POLICY IF EXISTS "Contractors can update own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can view own onboarding status" ON contractor_onboarding_status;
DROP POLICY IF EXISTS "Contractors can manage own schedules" ON contractor_schedules;
DROP POLICY IF EXISTS "Contractors can manage own unavailabilities" ON contractor_unavailabilities;
DROP POLICY IF EXISTS "Contractors can manage own services" ON contractor_services;
DROP POLICY IF EXISTS "Contractors can view own slug history" ON contractor_slug_history;
DROP POLICY IF EXISTS "Contractors can view own analytics" ON contractor_slug_analytics;
DROP POLICY IF EXISTS "Contractors can view own requests" ON booking_requests;
DROP POLICY IF EXISTS "Contractors can update own requests" ON booking_requests;
DROP POLICY IF EXISTS "Contractors can manage own profile specialties" ON contractor_profile_specialties;

-- Step 3: Drop all foreign key constraints
ALTER TABLE contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_contractor_id_fkey;
ALTER TABLE contractor_onboarding_status DROP CONSTRAINT IF EXISTS contractor_onboarding_status_contractor_id_fkey;
ALTER TABLE contractor_schedules DROP CONSTRAINT IF EXISTS contractor_schedules_contractor_id_fkey;
ALTER TABLE contractor_unavailabilities DROP CONSTRAINT IF EXISTS contractor_unavailabilities_contractor_id_fkey;
ALTER TABLE contractor_services DROP CONSTRAINT IF EXISTS contractor_services_contractor_id_fkey;
ALTER TABLE contractor_slug_history DROP CONSTRAINT IF EXISTS contractor_slug_history_contractor_id_fkey;
ALTER TABLE contractor_slug_analytics DROP CONSTRAINT IF EXISTS contractor_slug_analytics_contractor_id_fkey;
ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_contractor_id_fkey;
ALTER TABLE contractor_profile_specialties DROP CONSTRAINT IF EXISTS contractor_profile_specialties_contractor_id_fkey;

-- Step 4: Change contractor_id type from BIGINT to UUID in all tables
ALTER TABLE contractor_profiles ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE contractor_onboarding_status ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE contractor_schedules ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE contractor_unavailabilities ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE contractor_services ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE contractor_slug_history ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE contractor_slug_analytics ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE booking_requests ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;
ALTER TABLE contractor_profile_specialties ALTER COLUMN contractor_id TYPE UUID USING contractor_id::text::uuid;

-- Re-add foreign key constraints with proper UUID type
ALTER TABLE contractor_profiles
ADD CONSTRAINT contractor_profiles_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_onboarding_status
ADD CONSTRAINT contractor_onboarding_status_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_schedules
ADD CONSTRAINT contractor_schedules_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_unavailabilities
ADD CONSTRAINT contractor_unavailabilities_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_services
ADD CONSTRAINT contractor_services_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_slug_history
ADD CONSTRAINT contractor_slug_history_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_slug_analytics
ADD CONSTRAINT contractor_slug_analytics_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE booking_requests
ADD CONSTRAINT booking_requests_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON COLUMN contractor_profiles.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_onboarding_status.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_schedules.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_unavailabilities.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_services.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_slug_history.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_slug_analytics.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN booking_requests.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';

-- Step 4: Recreate RLS policies with UUID type
CREATE POLICY "Contractors can update own profile"
  ON contractor_profiles
  FOR UPDATE
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

CREATE POLICY "Contractors can view own onboarding status"
  ON contractor_onboarding_status
  FOR SELECT
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

CREATE POLICY "Contractors can manage own schedules"
  ON contractor_schedules
  FOR ALL
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

CREATE POLICY "Contractors can manage own unavailabilities"
  ON contractor_unavailabilities
  FOR ALL
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

CREATE POLICY "Contractors can manage own services"
  ON contractor_services
  FOR ALL
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

CREATE POLICY "Contractors can view own slug history"
  ON contractor_slug_history
  FOR SELECT
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

CREATE POLICY "Contractors can view own analytics"
  ON contractor_slug_analytics
  FOR SELECT
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

CREATE POLICY "Contractors can view own requests"
  ON booking_requests
  FOR SELECT
  TO authenticated
  USING (contractor_id::text = auth.uid()::text);

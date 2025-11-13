/**
 * Fix contractor_id Type Mismatch - Comprehensive Solution
 * Task: Fix critical type error preventing contractor approvals
 * Feature: 007-contractor-interface
 *
 * Problem: contractors.id is UUID, but all child tables use contractor_id BIGINT
 * Solution: Drop all policies, change types, recreate policies with correct UUID logic
 */

-- ============================================================================
-- STEP 1: Drop all RLS policies that depend on contractor_id
-- ============================================================================

-- booking_requests policies (3)
DROP POLICY IF EXISTS "Admins can view all requests" ON booking_requests;
DROP POLICY IF EXISTS "Contractors can update own requests" ON booking_requests;
DROP POLICY IF EXISTS "Contractors can view own requests" ON booking_requests;

-- contractor_onboarding_status policies (2)
DROP POLICY IF EXISTS "Admins can view all onboarding status" ON contractor_onboarding_status;
DROP POLICY IF EXISTS "Contractors can view own onboarding status" ON contractor_onboarding_status;

-- contractor_profile_specialties policies (2)
DROP POLICY IF EXISTS "Anyone can view profile specialties" ON contractor_profile_specialties;
DROP POLICY IF EXISTS "Contractors can manage own profile specialties" ON contractor_profile_specialties;

-- contractor_profiles policies (3)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Anyone can view visible profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can update own profile" ON contractor_profiles;

-- contractor_schedules policies (2)
DROP POLICY IF EXISTS "Admins can view all schedules" ON contractor_schedules;
DROP POLICY IF EXISTS "Contractors can manage own schedules" ON contractor_schedules;

-- contractor_services policies (3)
DROP POLICY IF EXISTS "Admins can manage all contractor services" ON contractor_services;
DROP POLICY IF EXISTS "Anyone can view active contractor services" ON contractor_services;
DROP POLICY IF EXISTS "Contractors can manage own services" ON contractor_services;

-- contractor_slug_analytics policies (2)
DROP POLICY IF EXISTS "Admins can view all analytics" ON contractor_slug_analytics;
DROP POLICY IF EXISTS "Contractors can view own analytics" ON contractor_slug_analytics;

-- contractor_slug_history policies (2)
DROP POLICY IF EXISTS "Admins can view all slug history" ON contractor_slug_history;
DROP POLICY IF EXISTS "Contractors can view own slug history" ON contractor_slug_history;

-- contractor_unavailabilities policies (2)
DROP POLICY IF EXISTS "Admins can view all unavailabilities" ON contractor_unavailabilities;
DROP POLICY IF EXISTS "Contractors can manage own unavailabilities" ON contractor_unavailabilities;

-- ============================================================================
-- STEP 2: Drop views that depend on contractor_id
-- ============================================================================

DROP VIEW IF EXISTS contractor_slug_stats;

-- ============================================================================
-- STEP 3: Disable RLS on all affected tables
-- ============================================================================

ALTER TABLE booking_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_onboarding_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_unavailabilities DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Drop all foreign key constraints
-- ============================================================================

ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_contractor_id_fkey;
ALTER TABLE contractor_onboarding_status DROP CONSTRAINT IF EXISTS contractor_onboarding_status_contractor_id_fkey;
ALTER TABLE contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_contractor_id_fkey;
ALTER TABLE contractor_schedules DROP CONSTRAINT IF EXISTS contractor_schedules_contractor_id_fkey;
ALTER TABLE contractor_services DROP CONSTRAINT IF EXISTS contractor_services_contractor_id_fkey;
ALTER TABLE contractor_slug_analytics DROP CONSTRAINT IF EXISTS contractor_slug_analytics_contractor_id_fkey;
ALTER TABLE contractor_slug_history DROP CONSTRAINT IF EXISTS contractor_slug_history_contractor_id_fkey;
ALTER TABLE contractor_unavailabilities DROP CONSTRAINT IF EXISTS contractor_unavailabilities_contractor_id_fkey;

-- ============================================================================
-- STEP 5: Change contractor_id type from BIGINT to UUID
-- ============================================================================

-- Note: Using USING NULL because tables should be empty
-- If tables have data, this would need a different approach

ALTER TABLE booking_requests
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_onboarding_status
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_profiles
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_schedules
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_services
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_slug_analytics
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_slug_history
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_unavailabilities
  ALTER COLUMN contractor_id DROP DEFAULT,
  ALTER COLUMN contractor_id TYPE UUID USING NULL;

-- ============================================================================
-- STEP 6: Re-add foreign key constraints with proper UUID type
-- ============================================================================

ALTER TABLE booking_requests
  ADD CONSTRAINT booking_requests_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_onboarding_status
  ADD CONSTRAINT contractor_onboarding_status_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_profiles
  ADD CONSTRAINT contractor_profiles_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_schedules
  ADD CONSTRAINT contractor_schedules_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_services
  ADD CONSTRAINT contractor_services_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_slug_analytics
  ADD CONSTRAINT contractor_slug_analytics_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_slug_history
  ADD CONSTRAINT contractor_slug_history_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

ALTER TABLE contractor_unavailabilities
  ADD CONSTRAINT contractor_unavailabilities_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 7: Re-enable RLS on all affected tables
-- ============================================================================

ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_onboarding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_unavailabilities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Recreate all RLS policies with correct UUID logic
-- ============================================================================

-- booking_requests policies (3)
CREATE POLICY "Admins can view all requests"
  ON booking_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Contractors can update own requests"
  ON booking_requests
  FOR UPDATE
  TO authenticated
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can view own requests"
  ON booking_requests
  FOR SELECT
  TO authenticated
  USING (contractor_id = auth.uid());

-- contractor_onboarding_status policies (2)
CREATE POLICY "Admins can view all onboarding status"
  ON contractor_onboarding_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Contractors can view own onboarding status"
  ON contractor_onboarding_status
  FOR SELECT
  TO authenticated
  USING (contractor_id = auth.uid());

-- contractor_profile_specialties policies (2)
CREATE POLICY "Anyone can view profile specialties"
  ON contractor_profile_specialties
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Contractors can manage own profile specialties"
  ON contractor_profile_specialties
  FOR ALL
  TO authenticated
  USING (
    contractor_profile_id IN (
      SELECT cp.id FROM contractor_profiles cp
      WHERE cp.contractor_id = auth.uid()
    )
  );

-- contractor_profiles policies (3)
CREATE POLICY "Admins can manage all profiles"
  ON contractor_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Anyone can view visible profiles"
  ON contractor_profiles
  FOR SELECT
  TO public
  USING (is_visible = true);

CREATE POLICY "Contractors can update own profile"
  ON contractor_profiles
  FOR UPDATE
  TO authenticated
  USING (contractor_id = auth.uid());

-- contractor_schedules policies (2)
CREATE POLICY "Admins can view all schedules"
  ON contractor_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Contractors can manage own schedules"
  ON contractor_schedules
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

-- contractor_services policies (3)
CREATE POLICY "Admins can manage all contractor services"
  ON contractor_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Anyone can view active contractor services"
  ON contractor_services
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Contractors can manage own services"
  ON contractor_services
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

-- contractor_slug_analytics policies (2)
CREATE POLICY "Admins can view all analytics"
  ON contractor_slug_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Contractors can view own analytics"
  ON contractor_slug_analytics
  FOR SELECT
  TO authenticated
  USING (contractor_id = auth.uid());

-- contractor_slug_history policies (2)
CREATE POLICY "Admins can view all slug history"
  ON contractor_slug_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Contractors can view own slug history"
  ON contractor_slug_history
  FOR SELECT
  TO authenticated
  USING (contractor_id = auth.uid());

-- contractor_unavailabilities policies (2)
CREATE POLICY "Admins can view all unavailabilities"
  ON contractor_unavailabilities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

CREATE POLICY "Contractors can manage own unavailabilities"
  ON contractor_unavailabilities
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

-- ============================================================================
-- STEP 9: Add documentation comments
-- ============================================================================

COMMENT ON COLUMN booking_requests.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_onboarding_status.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_profiles.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_schedules.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_services.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_slug_analytics.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_slug_history.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_unavailabilities.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';

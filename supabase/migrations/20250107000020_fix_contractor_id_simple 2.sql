/**
 * Fix contractor_id Type Mismatch (Simplified Approach)
 * Task: Fix critical type error preventing contractor approvals
 * Feature: 007-contractor-interface
 *
 * Problem: contractors.id is UUID, but all child tables use contractor_id BIGINT
 * Solution: Temporarily disable RLS, change types, re-enable RLS
 */

-- Step 1: Disable RLS on all affected tables
ALTER TABLE contractor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_onboarding_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_unavailabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profile_specialties DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop views that depend on contractor_id
DROP VIEW IF EXISTS contractor_slug_stats;

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
-- Note: Tables are empty so this is safe
ALTER TABLE contractor_profiles ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_profiles ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_onboarding_status ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_onboarding_status ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_schedules ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_schedules ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_unavailabilities ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_unavailabilities ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_services ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_services ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_slug_history ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_slug_history ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_slug_analytics ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_slug_analytics ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE booking_requests ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE booking_requests ALTER COLUMN contractor_id TYPE UUID USING NULL;

ALTER TABLE contractor_profile_specialties ALTER COLUMN contractor_id DROP DEFAULT;
ALTER TABLE contractor_profile_specialties ALTER COLUMN contractor_id TYPE UUID USING NULL;

-- Step 5: Re-add foreign key constraints with proper UUID type
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

ALTER TABLE contractor_profile_specialties
ADD CONSTRAINT contractor_profile_specialties_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE;

-- Step 6: Re-enable RLS on all affected tables
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_onboarding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_unavailabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_slug_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profile_specialties ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON COLUMN contractor_profiles.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_onboarding_status.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_schedules.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_unavailabilities.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_services.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_slug_history.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_slug_analytics.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN booking_requests.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';
COMMENT ON COLUMN contractor_profile_specialties.contractor_id IS 'UUID reference to contractors.id (matches auth.users.id)';

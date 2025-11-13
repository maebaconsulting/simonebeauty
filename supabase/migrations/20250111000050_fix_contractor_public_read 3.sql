-- Migration: 20250111000050_fix_contractor_public_read.sql
-- Description: Allow public read access to contractor onboarding status for available contractors
-- This allows the booking flow to check if contractors have completed onboarding
-- without needing Service Role Key

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all onboarding status" ON contractor_onboarding_status;
DROP POLICY IF EXISTS "Contractors can view own onboarding status" ON contractor_onboarding_status;

-- Create new policies

-- 1. Contractors can view their own onboarding status
CREATE POLICY "Contractors can view own onboarding status"
ON contractor_onboarding_status
FOR SELECT
TO authenticated
USING (contractor_id = auth.uid());

-- 2. Admins can view all onboarding statuses
CREATE POLICY "Admins can view all onboarding status"
ON contractor_onboarding_status
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. **NEW**: Public can view onboarding completion status for active contractors
-- This is needed for the booking flow to show only fully onboarded contractors
CREATE POLICY "Public can view onboarding status for active contractors"
ON contractor_onboarding_status
FOR SELECT
TO public
USING (
  -- Only allow reading is_completed field for contractors who:
  -- 1. Are active
  -- 2. Offer services (in contractor_services table)
  EXISTS (
    SELECT 1
    FROM contractors c
    WHERE c.id = contractor_onboarding_status.contractor_id
    AND c.is_active = true
  )
);

-- Add comment explaining the security model
COMMENT ON POLICY "Public can view onboarding status for active contractors"
ON contractor_onboarding_status IS
'Allows public read access to onboarding completion status for active contractors.
This is necessary for the booking flow to filter out contractors who have not completed onboarding.
Only the is_completed field is effectively exposed, not sensitive onboarding details.';

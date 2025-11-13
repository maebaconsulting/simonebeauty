/**
 * Add Missing INSERT RLS Policies for Contractor Approval
 * Task: Fix contractor approval - missing INSERT policies
 * Feature: 007-contractor-interface
 *
 * Problem: Edge function (with service role) cannot INSERT into contractor_profiles
 * and contractor_onboarding_status due to missing INSERT policies
 *
 * Solution: Add INSERT policies for admins (edge function runs as service role with admin-level access)
 */

-- ============================================================================
-- Add INSERT policy for contractor_profiles
-- ============================================================================

-- Allow admins to insert contractor profiles (needed for approval flow)
CREATE POLICY "Admins can insert contractor profiles"
  ON contractor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

-- ============================================================================
-- Add INSERT policy for contractor_onboarding_status
-- ============================================================================

-- Allow admins to insert onboarding status (needed for approval flow)
CREATE POLICY "Admins can insert onboarding status"
  ON contractor_onboarding_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON POLICY "Admins can insert contractor profiles" ON contractor_profiles IS
  'Allows admin users to create contractor profiles during the approval process';

COMMENT ON POLICY "Admins can insert onboarding status" ON contractor_onboarding_status IS
  'Allows admin users to initialize onboarding status during the approval process';

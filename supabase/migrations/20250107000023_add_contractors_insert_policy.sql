/**
 * Add Service Role INSERT Policy for Contractors Table
 * Task: Fix contractor approval - missing INSERT policy on contractors table
 * Feature: 007-contractor-interface
 *
 * Problem: Edge function (with service role) cannot INSERT into contractors table
 * because existing RLS policies only allow authenticated users with admin role
 * (which checks auth.uid() - NULL for service role)
 *
 * Solution: Add service role policy to allow edge function to create contractor records
 */

-- ============================================================================
-- Add INSERT/ALL policy for service role on contractors table
-- ============================================================================

-- Allow service role to manage contractors (for edge function approval flow)
CREATE POLICY "Service role can manage contractors"
  ON contractors
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON POLICY "Service role can manage contractors" ON contractors IS
  'Allows service role (edge functions) to create and manage contractor records during the approval process';

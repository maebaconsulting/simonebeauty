/**
 * Immediate Fix: Admin Access to Contractors
 * Feature: 018-international-market-segmentation
 *
 * Problem: The JWT hook requires dashboard activation, which blocks admin access.
 * Solution: Modify RLS policy to check profiles.role directly (less performant but works immediately)
 *
 * This is a temporary fix until the JWT hook is activated.
 * Once JWT hook is active, this can be reverted to the JWT-based check for better performance.
 */

-- Drop the existing admin policy that depends on JWT role claim
DROP POLICY IF EXISTS "Admins can manage all contractors" ON contractors;

-- Create new admin policy that checks profiles.role directly
CREATE POLICY "Admins can manage all contractors (direct check)"
ON contractors
FOR ALL
TO authenticated
USING (
  -- Check if the authenticated user has admin or manager role in profiles table
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE operations
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Verify the policy was created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'contractors'
  AND policyname = 'Admins can manage all contractors (direct check)';

  IF policy_count = 1 THEN
    RAISE NOTICE '✅ Admin policy created successfully';
    RAISE NOTICE 'Admins can now view all contractors immediately (no JWT hook required)';
  ELSE
    RAISE WARNING '❌ Policy creation failed';
  END IF;
END $$;

-- Add comment
COMMENT ON POLICY "Admins can manage all contractors (direct check)" ON contractors IS
  'Temporary policy that checks profiles.role directly instead of JWT claim. Less performant but works without JWT hook activation.';

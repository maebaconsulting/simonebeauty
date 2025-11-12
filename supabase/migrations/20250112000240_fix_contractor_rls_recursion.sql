/**
 * Fix RLS Recursion Issue on Contractors Table
 * Feature: 018-international-market-segmentation
 *
 * Problem: The "Contractors see own market data" policy causes infinite recursion
 * because it queries the contractors table within a policy on the same table.
 *
 * Solution: Drop the problematic policy. Admins already have access via
 * "Admins can manage all contractors" policy.
 */

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Contractors see own market data" ON contractors;

-- Verify remaining policies
DO $$
DECLARE
  policy_count INTEGER;
  rec RECORD;
BEGIN
  -- Count remaining policies on contractors table
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'contractors';

  RAISE NOTICE 'Remaining RLS policies on contractors table: %', policy_count;

  -- Log the remaining policies
  RAISE NOTICE 'Active policies:';
  FOR rec IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'contractors'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%)' , rec.policyname, rec.cmd;
  END LOOP;
END $$;

-- Add comment
COMMENT ON TABLE contractors IS
  'Contractors table with RLS policies. Recursive policy removed 2025-01-12 to fix infinite recursion issue.';

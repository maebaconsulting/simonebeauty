/**
 * Add DELETE Policy for Contractor Applications
 * Task: T038 - Allow admins to delete rejected applications only
 * Feature: 007-contractor-interface
 * Requirement: FR-020a
 *
 * Security: Only rejected applications can be deleted (hard delete)
 * This prevents accidental deletion of pending, approved, or interview-scheduled applications
 */

-- Add DELETE policy for admins to delete REJECTED applications only
CREATE POLICY "Admins can delete rejected applications only"
  ON public.contractor_applications
  FOR DELETE
  TO authenticated
  USING (
    -- User must be an admin
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
    -- AND application must be rejected
    AND status = 'rejected'
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Admins can delete rejected applications only" ON public.contractor_applications IS
  'Allows administrators to permanently delete contractor applications, but ONLY if the application status is "rejected". This prevents accidental deletion of active, pending, or approved applications. Per FR-020a, this is an irreversible hard delete operation.';

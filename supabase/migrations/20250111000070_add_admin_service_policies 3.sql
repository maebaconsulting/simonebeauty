-- Migration: Add RLS policies for admin/manager service management
-- Feature: 018-service-management-crud
-- Description: Allow admins and managers to read all services and update them

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view active services" ON services;

-- Policy 1: Anyone can view active services (public)
CREATE POLICY "Public can view active services"
ON services
FOR SELECT
USING (is_active = true);

-- Policy 2: Admins and managers can view all services
CREATE POLICY "Admins and managers can view all services"
ON services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy 3: Admins and managers can update services
CREATE POLICY "Admins and managers can update services"
ON services
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy 4: Admins and managers can insert services
CREATE POLICY "Admins and managers can insert services"
ON services
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy 5: Admins can delete services (soft delete via update)
-- Note: We don't need a DELETE policy since we use soft deletes (is_active = false)

-- Comment
COMMENT ON POLICY "Public can view active services" ON services IS 'Allow anyone to view active services';
COMMENT ON POLICY "Admins and managers can view all services" ON services IS 'Allow admins and managers to view all services including inactive ones';
COMMENT ON POLICY "Admins and managers can update services" ON services IS 'Allow admins and managers to update service information';
COMMENT ON POLICY "Admins and managers can insert services" ON services IS 'Allow admins and managers to create new services';

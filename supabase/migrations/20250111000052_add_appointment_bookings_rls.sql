-- Migration: 20250111000052_add_appointment_bookings_rls.sql
-- Description: Add RLS policies for appointment_bookings so clients can view their own bookings

-- Enable RLS on appointment_bookings
ALTER TABLE appointment_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clients can view own bookings" ON appointment_bookings;
DROP POLICY IF EXISTS "Contractors can view assigned bookings" ON appointment_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON appointment_bookings;
DROP POLICY IF EXISTS "System can insert bookings" ON appointment_bookings;

-- 1. Clients can view their own bookings
CREATE POLICY "Clients can view own bookings"
ON appointment_bookings
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- 2. Contractors can view bookings assigned to them
CREATE POLICY "Contractors can view assigned bookings"
ON appointment_bookings
FOR SELECT
TO authenticated
USING (contractor_id = auth.uid());

-- 3. Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON appointment_bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Authenticated users can insert bookings (for their own client_id)
CREATE POLICY "Clients can create own bookings"
ON appointment_bookings
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- 5. Clients can update their own bookings (e.g., cancel)
CREATE POLICY "Clients can update own bookings"
ON appointment_bookings
FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- 6. Contractors can update bookings assigned to them
CREATE POLICY "Contractors can update assigned bookings"
ON appointment_bookings
FOR UPDATE
TO authenticated
USING (contractor_id = auth.uid())
WITH CHECK (contractor_id = auth.uid());

-- 7. Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
ON appointment_bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

COMMENT ON TABLE appointment_bookings IS 'Bookings table with RLS enabled. Clients can view/manage their own bookings, contractors can view/manage assigned bookings.';

-- Migration: Add RLS policies for market-filtered bookings
-- Feature: 018-international-market-segmentation
-- User Story 6: Market-Filtered Data Access

-- Policy: Clients can view own bookings
DROP POLICY IF EXISTS "Clients can view own bookings" ON appointment_bookings;
CREATE POLICY "Clients can view own bookings"
ON appointment_bookings
FOR SELECT
USING (
  client_id = auth.uid() OR -- Own bookings
  (auth.jwt() ->> 'role')::text IN ('admin', 'manager') -- Admins see all
);

-- Policy: Contractors see own market bookings
DROP POLICY IF EXISTS "Contractors see own market bookings" ON appointment_bookings;
CREATE POLICY "Contractors see own market bookings"
ON appointment_bookings
FOR SELECT
USING (
  contractor_id = auth.uid() OR -- Own bookings
  (auth.jwt() ->> 'role')::text IN ('admin', 'manager') OR -- Admins see all
  contractor_id IN (
    SELECT id FROM contractors 
    WHERE market_id = (SELECT market_id FROM contractors WHERE id = auth.uid())
  ) -- Same market
);

-- Policy: Bookings must respect market boundaries (INSERT/UPDATE)
DROP POLICY IF EXISTS "Bookings respect market boundaries" ON appointment_bookings;
CREATE POLICY "Bookings respect market boundaries"
ON appointment_bookings
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role')::text IN ('admin', 'manager') OR -- Admins bypass
  (
    -- Ensure contractor is in a market
    contractor_id IN (SELECT id FROM contractors WHERE market_id IS NOT NULL)
  )
);

-- Add comments
COMMENT ON POLICY "Clients can view own bookings" ON appointment_bookings IS
'Clients can only view their own bookings. Admins can view all.';

COMMENT ON POLICY "Contractors see own market bookings" ON appointment_bookings IS
'Contractors can view bookings assigned to them or to contractors in the same market.';

COMMENT ON POLICY "Bookings respect market boundaries" ON appointment_bookings IS
'Bookings can only be created for contractors that have a market assigned.';

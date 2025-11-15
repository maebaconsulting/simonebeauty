-- Migration: Add RLS policies for contractor market assignment
-- Feature: 018-international-market-segmentation  
-- User Story 4: Contractor Market Assignment

-- Policy: Contractors see own market data
-- Contractors can only view other contractors in the same market
DROP POLICY IF EXISTS "Contractors see own market data" ON contractors;
CREATE POLICY "Contractors see own market data"
ON contractors
FOR SELECT
USING (
  auth.uid() = id OR -- Own profile
  (auth.jwt() ->> 'role')::text IN ('admin', 'manager') OR -- Admins see all
  market_id = (
    SELECT market_id FROM contractors WHERE id = auth.uid()
  ) -- Same market
);

-- Policy: Admin can manage contractors across markets
DROP POLICY IF EXISTS "Admins can manage all contractors" ON contractors;
CREATE POLICY "Admins can manage all contractors"
ON contractors
FOR ALL
USING ((auth.jwt() ->> 'role')::text IN ('admin', 'manager'));

-- Add comment explaining the policies
COMMENT ON POLICY "Contractors see own market data" ON contractors IS
'Contractors can view their own data and other contractors in the same market. Admins can view all.';

COMMENT ON POLICY "Admins can manage all contractors" ON contractors IS
'Admins and managers can perform all operations on contractors across all markets.';

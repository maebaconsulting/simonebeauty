-- Migration: Add RLS policies for service market availability
-- Feature: 018-international-market-segmentation
-- User Story 5: Service Multi-Market Availability

-- Enable RLS on service_market_availability
ALTER TABLE service_market_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view available services by market
DROP POLICY IF EXISTS "Public can view available services" ON service_market_availability;
CREATE POLICY "Public can view available services"
ON service_market_availability
FOR SELECT
USING (is_available = true);

-- Policy: Admins can manage service availability
DROP POLICY IF EXISTS "Admins can manage service availability" ON service_market_availability;
CREATE POLICY "Admins can manage service availability"
ON service_market_availability
FOR ALL
USING ((auth.jwt() ->> 'role')::text IN ('admin', 'manager'));

-- Add comments
COMMENT ON POLICY "Public can view available services" ON service_market_availability IS
'Public users can only see services that are available in markets.';

COMMENT ON POLICY "Admins can manage service availability" ON service_market_availability IS
'Admins can create, update, and delete service-market associations.';

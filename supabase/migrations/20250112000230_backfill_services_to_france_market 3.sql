/**
 * Backfill Migration: Assign All Existing Services to France Market
 * Feature: 018-international-market-segmentation
 * Tasks: T087-T091 - Backfill existing data
 *
 * This migration assigns all existing services to the France market (id=1)
 * as the default market for the initial deployment.
 */

-- Insert service-market availability for all existing services
-- Assign to France market (id=1) with default settings
INSERT INTO service_market_availability (
  service_id,
  market_id,
  is_available,
  localized_price,
  created_at,
  updated_at
)
SELECT
  s.id as service_id,
  1 as market_id, -- France market
  true as is_available,
  NULL as localized_price, -- Use service's base_price
  NOW() as created_at,
  NOW() as updated_at
FROM services s
WHERE NOT EXISTS (
  -- Don't insert if already exists
  SELECT 1
  FROM service_market_availability sma
  WHERE sma.service_id = s.id
  AND sma.market_id = 1
);

-- Verify the backfill
DO $$
DECLARE
  total_services INTEGER;
  services_in_france INTEGER;
BEGIN
  -- Count total services
  SELECT COUNT(*) INTO total_services FROM services;

  -- Count services available in France market
  SELECT COUNT(DISTINCT service_id) INTO services_in_france
  FROM service_market_availability
  WHERE market_id = 1 AND is_available = true;

  -- Log results
  RAISE NOTICE 'Backfill completed:';
  RAISE NOTICE '  Total services: %', total_services;
  RAISE NOTICE '  Services in France market: %', services_in_france;

  -- Verify all services are assigned
  IF total_services != services_in_france THEN
    RAISE WARNING 'Not all services were assigned to France market. Expected %, got %',
                  total_services, services_in_france;
  ELSE
    RAISE NOTICE '  ✓ All services successfully assigned to France market';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE service_market_availability IS
  'Junction table linking services to markets. Initial backfill (2025-01-12) assigned all 89 existing services to France market (id=1).';

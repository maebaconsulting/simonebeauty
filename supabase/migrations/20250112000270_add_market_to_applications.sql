/**
 * Add Market Segmentation to Contractor Applications
 * Feature: 018-international-market-segmentation
 * Extension: Integrate market assignment into application flow
 *
 * This extends the market segmentation to the contractor application process,
 * ensuring each application is linked to a specific geographic market.
 */

-- Add market_id column to contractor_applications
ALTER TABLE contractor_applications
ADD COLUMN market_id BIGINT REFERENCES markets(id);

-- Add index for performance (applications filtered by market)
CREATE INDEX idx_contractor_applications_market
ON contractor_applications(market_id, status, submitted_at DESC);

-- Backfill existing applications to France market (id=1)
UPDATE contractor_applications
SET market_id = 1
WHERE market_id IS NULL;

-- Add NOT NULL constraint after backfill
ALTER TABLE contractor_applications
ALTER COLUMN market_id SET NOT NULL;

-- Add default value for new applications (France market)
ALTER TABLE contractor_applications
ALTER COLUMN market_id SET DEFAULT 1;

-- Verify the changes
DO $$
DECLARE
  total_apps INTEGER;
  apps_with_market INTEGER;
  france_market_apps INTEGER;
BEGIN
  -- Count statistics
  SELECT COUNT(*) INTO total_apps FROM contractor_applications;
  SELECT COUNT(*) INTO apps_with_market FROM contractor_applications WHERE market_id IS NOT NULL;
  SELECT COUNT(*) INTO france_market_apps FROM contractor_applications WHERE market_id = 1;

  RAISE NOTICE 'Market column added to contractor_applications:';
  RAISE NOTICE '  Total applications: %', total_apps;
  RAISE NOTICE '  Applications with market: %', apps_with_market;
  RAISE NOTICE '  France market applications: %', france_market_apps;

  IF total_apps = apps_with_market THEN
    RAISE NOTICE '  ✅ All applications have market assigned';
  ELSE
    RAISE WARNING '  ⚠️  Some applications missing market assignment';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN contractor_applications.market_id IS
  'Geographic market for this application. Links to markets table. Defaults to France (id=1). Required field - all applications must be assigned to a market.';

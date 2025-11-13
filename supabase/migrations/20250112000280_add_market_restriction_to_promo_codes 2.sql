-- Migration: Add market restriction to promo codes
-- Feature: 019-market-integration-optimization
-- Phase 2, Task 1: Allow promo codes to be restricted to specific markets
-- Date: 2025-01-12

-- Add specific_markets column to promo_codes table
-- NULL or empty array = valid for all markets
-- Non-empty array = only valid in specified markets
ALTER TABLE promo_codes
ADD COLUMN IF NOT EXISTS specific_markets bigint[];

-- Add index for efficient market filtering
CREATE INDEX IF NOT EXISTS idx_promo_codes_markets
ON promo_codes USING GIN (specific_markets)
WHERE is_active = true;

-- Add comment for documentation
COMMENT ON COLUMN promo_codes.specific_markets IS 'Array of market IDs where this promo code is valid. NULL or empty = all markets.';

-- Update updated_at timestamp
UPDATE promo_codes
SET updated_at = NOW()
WHERE specific_markets IS NULL;

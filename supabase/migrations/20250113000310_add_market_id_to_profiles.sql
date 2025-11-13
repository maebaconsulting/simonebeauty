-- Migration: 20250113000310_add_market_id_to_profiles.sql
-- Description: Add market_id column to profiles table for client market segmentation
-- This allows clients to be assigned to specific markets like contractors

-- Add market_id column to profiles
ALTER TABLE profiles
ADD COLUMN market_id INTEGER REFERENCES markets(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_profiles_market_id ON profiles(market_id) WHERE market_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.market_id IS
'Market assignment for clients. NULL means client is not assigned to a specific market (global client).';

-- Note: Existing clients will have NULL market_id (global clients)
-- Admins can assign markets to clients through the admin interface

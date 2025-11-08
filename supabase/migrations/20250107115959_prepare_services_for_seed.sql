-- Migration: 20250107115959_prepare_services_for_seed.sql
-- Feature: Prepare services table for seed data
-- Description: Make old 'category' column nullable since we're using category_id now
-- Date: 2025-11-07

-- Remove NOT NULL constraint from deprecated 'category' column
-- This allows us to insert new services using only category_id/subcategory_id
ALTER TABLE services ALTER COLUMN category DROP NOT NULL;

-- Update comment to indicate the column is deprecated
COMMENT ON COLUMN services.category IS 'DEPRECATED: Use category_id instead. Column kept for backward compatibility. Now nullable.';

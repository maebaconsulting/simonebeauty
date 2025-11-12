-- Migration: Add missing service columns
-- Feature: 018-service-management-crud
-- Description: Add is_featured, short_description, and service_type columns to services table

-- Add is_featured column (for highlighting services on homepage)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add short_description column (for service cards/lists)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Add service_type column (at_home, at_location, hybrid)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'at_home';

-- Add check constraint for service_type
ALTER TABLE services
ADD CONSTRAINT service_type_check
CHECK (service_type IN ('at_home', 'at_location', 'hybrid'));

-- Comment on columns
COMMENT ON COLUMN services.is_featured IS 'Whether this service should be featured on homepage or promotional materials';
COMMENT ON COLUMN services.short_description IS 'Short description for service cards and list views (max 500 chars recommended)';
COMMENT ON COLUMN services.service_type IS 'Type of service delivery: at_home (domicile), at_location (sur place), hybrid (both)';

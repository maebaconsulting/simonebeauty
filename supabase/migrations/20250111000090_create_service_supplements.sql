/**
 * Migration: Create service_supplements table
 * Feature: Service Supplements Management
 *
 * Creates table for managing service add-ons and supplements
 * (extended duration, additional products, special options, etc.)
 */

-- Create service_supplements table
CREATE TABLE IF NOT EXISTS service_supplements (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('duration', 'product', 'addon', 'option')),
  price_adjustment INTEGER NOT NULL DEFAULT 0, -- in cents (can be negative for discounts)
  duration_adjustment INTEGER DEFAULT 0, -- in minutes (can be negative)
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_service_supplements_service_id ON service_supplements(service_id);
CREATE INDEX idx_service_supplements_active ON service_supplements(is_active);
CREATE INDEX idx_service_supplements_display_order ON service_supplements(service_id, display_order);

-- Enable RLS
ALTER TABLE service_supplements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view active supplements
CREATE POLICY "Public can view active supplements"
  ON service_supplements
  FOR SELECT
  USING (is_active = true);

-- RLS Policy: Admins and managers can manage supplements
CREATE POLICY "Admins and managers can manage supplements"
  ON service_supplements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_service_supplements_updated_at
  BEFORE UPDATE ON service_supplements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE service_supplements IS 'Supplements and add-ons available for services (extended duration, additional products, special options)';

-- Migration: 20250107000006_create_contractor_services.sql
-- Feature: 007 - Contractor Interface
-- Description: Create contractor services table with indexes and RLS policies
-- Date: 2025-11-07

CREATE TABLE contractor_services (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Activation
  is_active BOOLEAN DEFAULT true,

  -- Personnalisation (optionnel)
  custom_price DECIMAL(10, 2), -- NULL = utiliser le prix par défaut du service
  custom_duration INT, -- NULL = utiliser la durée par défaut (en minutes)
  custom_description TEXT, -- NULL = utiliser la description par défaut

  -- Métadonnées
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint
  UNIQUE (contractor_id, service_id)
);

COMMENT ON TABLE contractor_services IS 'Services proposés par chaque prestataire avec possibilité de personnalisation (prix, durée)';
COMMENT ON COLUMN contractor_services.custom_price IS 'Prix personnalisé pour ce prestataire (NULL = utiliser le prix par défaut du service)';
COMMENT ON COLUMN contractor_services.custom_duration IS 'Durée personnalisée en minutes (NULL = utiliser la durée par défaut)';
COMMENT ON COLUMN contractor_services.custom_description IS 'Description personnalisée visible par les clients (NULL = utiliser description par défaut)';
COMMENT ON COLUMN contractor_services.is_active IS 'Si false, le service n''est plus proposé par ce prestataire';

-- Indexes
CREATE INDEX idx_contractor_services_contractor ON contractor_services(contractor_id) WHERE is_active = true;
CREATE INDEX idx_contractor_services_service ON contractor_services(service_id);

-- RLS Policies
ALTER TABLE contractor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contractor services"
ON contractor_services FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Contractors can manage own services"
ON contractor_services FOR ALL
TO authenticated
USING (
  contractor_id = auth.uid()
);

CREATE POLICY "Admins can manage all contractor services"
ON contractor_services FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Migration: 20250108000000_create_client_addresses.sql
-- Feature: Booking Flow - Client Addresses
-- Description: Create client_addresses table for storing delivery/service addresses
-- Date: 2025-11-08

-- =============================================================================
-- client_addresses - Adresses de livraison/service des clients
-- =============================================================================

CREATE TABLE client_addresses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Relations
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type et label
  type VARCHAR(50) NOT NULL CHECK (type IN ('home', 'work', 'other')) DEFAULT 'home',
  label VARCHAR(100),

  -- Adresse complète
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(2) DEFAULT 'FR',

  -- Coordonnées géographiques (pour calcul de distance)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Informations complémentaires
  building_info TEXT, -- Bâtiment, étage, code d'accès, etc.
  delivery_instructions TEXT,

  -- Statut
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Commentaires
COMMENT ON TABLE client_addresses IS 'Adresses de service des clients (domicile, travail, autre)';
COMMENT ON COLUMN client_addresses.client_id IS 'Client propriétaire de l''adresse';
COMMENT ON COLUMN client_addresses.type IS 'Type d''adresse: home (domicile), work (travail), other (autre)';
COMMENT ON COLUMN client_addresses.label IS 'Libellé personnalisé (ex: "Appartement Paris", "Bureau La Défense")';
COMMENT ON COLUMN client_addresses.building_info IS 'Informations complémentaires: bâtiment, étage, code, interphone';
COMMENT ON COLUMN client_addresses.is_default IS 'Adresse par défaut pour ce client (une seule par client)';
COMMENT ON COLUMN client_addresses.latitude IS 'Latitude pour calcul de distance et zone de service';
COMMENT ON COLUMN client_addresses.longitude IS 'Longitude pour calcul de distance et zone de service';

-- Indexes
CREATE INDEX idx_client_addresses_client ON client_addresses(client_id);
CREATE INDEX idx_client_addresses_default ON client_addresses(client_id, is_default) WHERE is_default = true;
CREATE INDEX idx_client_addresses_active ON client_addresses(is_active);
CREATE INDEX idx_client_addresses_location ON client_addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Trigger: Ensure only one default address per client
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la nouvelle adresse est marquée comme défaut
  IF NEW.is_default = true THEN
    -- Désactiver le statut défaut des autres adresses du même client
    UPDATE client_addresses
    SET is_default = false
    WHERE client_id = NEW.client_id
    AND id != NEW.id
    AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_address
BEFORE INSERT OR UPDATE ON client_addresses
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_address();

-- Trigger: Updated at
CREATE OR REPLACE FUNCTION update_client_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_addresses_updated_at
BEFORE UPDATE ON client_addresses
FOR EACH ROW
EXECUTE FUNCTION update_client_addresses_updated_at();

-- RLS Policies
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;

-- Clients can view their own addresses
CREATE POLICY "Clients can view their own addresses"
ON client_addresses FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- Clients can insert their own addresses
CREATE POLICY "Clients can insert their own addresses"
ON client_addresses FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- Clients can update their own addresses
CREATE POLICY "Clients can update their own addresses"
ON client_addresses FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Clients can delete their own addresses
CREATE POLICY "Clients can delete their own addresses"
ON client_addresses FOR DELETE
TO authenticated
USING (client_id = auth.uid());

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses"
ON client_addresses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

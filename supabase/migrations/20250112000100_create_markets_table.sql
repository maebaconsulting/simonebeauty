-- Migration: Create markets table for international market segmentation
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Create markets table
CREATE TABLE IF NOT EXISTS markets (
  -- Identity
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Core attributes
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL CHECK (code ~ '^[A-Z]{2,3}$'),

  -- Regional settings
  currency_code VARCHAR(3) NOT NULL CHECK (
    currency_code ~ '^[A-Z]{3}$' AND
    currency_code IN ('EUR', 'CHF', 'USD', 'GBP', 'CAD', 'JPY')
  ),
  timezone VARCHAR(50) NOT NULL CHECK (
    timezone IN (
      'Europe/Paris', 'Europe/Brussels', 'Europe/Zurich', 'Europe/Madrid',
      'Europe/Berlin', 'Europe/London', 'Europe/Rome', 'Europe/Amsterdam',
      'America/New_York', 'America/Los_Angeles', 'America/Toronto',
      'America/Montreal', 'UTC'
    )
  ),
  supported_languages JSONB NOT NULL DEFAULT '["fr"]' CHECK (
    jsonb_typeof(supported_languages) = 'array'
  ),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments (French as per constitution)
COMMENT ON TABLE markets IS 'Marchés géographiques où la plateforme opère (FR, BE, CH, ES, DE, etc.)';
COMMENT ON COLUMN markets.id IS 'Identifiant unique du marché (BIGINT auto-increment)';
COMMENT ON COLUMN markets.name IS 'Nom du marché (ex: "France", "Belgique")';
COMMENT ON COLUMN markets.code IS 'Code ISO 3166-1 alpha-2 (FR, BE, CH, ES, DE)';
COMMENT ON COLUMN markets.currency_code IS 'Code devise ISO 4217 (EUR, CHF, USD, GBP)';
COMMENT ON COLUMN markets.timezone IS 'Fuseau horaire IANA (Europe/Paris, Europe/Brussels, Europe/Zurich)';
COMMENT ON COLUMN markets.supported_languages IS 'Langues supportées (codes ISO 639-1: fr, en, de, nl, it)';
COMMENT ON COLUMN markets.is_active IS 'Si FALSE, le marché ne peut plus recevoir de nouveaux contractors/clients';

-- Indexes
CREATE INDEX idx_markets_code ON markets(code);
CREATE INDEX idx_markets_is_active ON markets(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER markets_updated_at_trigger
BEFORE UPDATE ON markets
FOR EACH ROW
EXECUTE FUNCTION update_markets_updated_at();

-- Insert initial markets
INSERT INTO markets (name, code, currency_code, timezone, supported_languages) VALUES
('France', 'FR', 'EUR', 'Europe/Paris', '["fr", "en"]'),
('Belgique', 'BE', 'EUR', 'Europe/Brussels', '["fr", "nl", "en"]'),
('Suisse', 'CH', 'CHF', 'Europe/Zurich', '["fr", "de", "it", "en"]'),
('Espagne', 'ES', 'EUR', 'Europe/Madrid', '["es", "en"]'),
('Allemagne', 'DE', 'EUR', 'Europe/Berlin', '["de", "en"]');

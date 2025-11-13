-- Migration: Create service_market_availability junction table
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Create service_market_availability table
CREATE TABLE IF NOT EXISTS service_market_availability (
  -- Composite primary key
  service_id BIGINT NOT NULL,
  market_id BIGINT NOT NULL,

  -- Market-specific configuration
  is_available BOOLEAN DEFAULT true,
  localized_price INTEGER CHECK (localized_price > 0),
  localized_name VARCHAR(200),
  localized_description TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Primary key
  PRIMARY KEY (service_id, market_id)
);

-- Foreign key constraints
ALTER TABLE service_market_availability
ADD CONSTRAINT fk_sma_service_id
FOREIGN KEY (service_id) REFERENCES services(id)
ON DELETE CASCADE;

ALTER TABLE service_market_availability
ADD CONSTRAINT fk_sma_market_id
FOREIGN KEY (market_id) REFERENCES markets(id)
ON DELETE RESTRICT;

-- Comments
COMMENT ON TABLE service_market_availability IS
'Table de jonction services ↔ marchés. Un service peut être disponible dans plusieurs marchés avec prix localisés.';

COMMENT ON COLUMN service_market_availability.service_id IS
'Référence au service (services.id)';

COMMENT ON COLUMN service_market_availability.market_id IS
'Référence au marché (markets.id)';

COMMENT ON COLUMN service_market_availability.is_available IS
'Si FALSE, le service n''est plus proposé dans ce marché (soft delete)';

COMMENT ON COLUMN service_market_availability.localized_price IS
'Prix du service dans ce marché (en centimes). NULL = utiliser services.base_price';

COMMENT ON COLUMN service_market_availability.localized_name IS
'Nom traduit du service pour ce marché. NULL = utiliser services.name';

COMMENT ON COLUMN service_market_availability.localized_description IS
'Description traduite pour ce marché. NULL = utiliser services.description';

COMMENT ON CONSTRAINT fk_sma_service_id ON service_market_availability IS
'FK vers services. CASCADE supprime disponibilité si service supprimé.';

COMMENT ON CONSTRAINT fk_sma_market_id ON service_market_availability IS
'FK vers markets. RESTRICT empêche suppression marché avec services actifs.';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sma_service_id
ON service_market_availability(service_id);

CREATE INDEX IF NOT EXISTS idx_sma_market_id
ON service_market_availability(market_id);

-- Partial index for frequently queried available services
CREATE INDEX IF NOT EXISTS idx_sma_market_available
ON service_market_availability(market_id, is_available)
WHERE is_available = true;

COMMENT ON INDEX idx_sma_service_id IS
'Index pour lister marchés où un service est disponible';

COMMENT ON INDEX idx_sma_market_id IS
'Index pour lister services disponibles dans un marché';

COMMENT ON INDEX idx_sma_market_available IS
'Index partiel pour requêtes fréquentes: services disponibles par marché';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_market_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sma_updated_at_trigger
BEFORE UPDATE ON service_market_availability
FOR EACH ROW
EXECUTE FUNCTION update_service_market_availability_updated_at();

COMMENT ON FUNCTION update_service_market_availability_updated_at() IS
'Trigger function pour mettre à jour automatiquement updated_at';

COMMENT ON TRIGGER sma_updated_at_trigger ON service_market_availability IS
'Trigger BEFORE UPDATE pour horodater les modifications';

-- Verify table was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'service_market_availability'
  ) THEN
    RAISE EXCEPTION 'service_market_availability table n''a pas été créée';
  END IF;

  RAISE NOTICE 'Table service_market_availability créée avec succès';
END $$;

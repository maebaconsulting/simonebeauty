-- Migration: Add contractor_code and market_id columns to contractors table
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Step 1: Add contractor_code column (nullable initially)
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS contractor_code VARCHAR(10) UNIQUE;

COMMENT ON COLUMN contractors.contractor_code IS
'Code unique du prestataire (format CTR-XXXXXX). Généré automatiquement via trigger lors de l''insertion.';

-- Step 2: Add market_id column (nullable initially, will be set NOT NULL after backfill)
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS market_id BIGINT;

COMMENT ON COLUMN contractors.market_id IS
'Marché géographique du prestataire (FR, BE, CH, etc.). Un prestataire appartient à UN SEUL marché.';

-- Step 3: Create foreign key constraint to markets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_contractors_market_id'
  ) THEN
    ALTER TABLE contractors
    ADD CONSTRAINT fk_contractors_market_id
    FOREIGN KEY (market_id) REFERENCES markets(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

COMMENT ON CONSTRAINT fk_contractors_market_id ON contractors IS
'FK vers markets. RESTRICT empêche suppression marché avec prestataires actifs.';

-- Create indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_contractors_contractor_code
ON contractors(contractor_code)
WHERE contractor_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contractors_market_id
ON contractors(market_id)
WHERE market_id IS NOT NULL;

-- Partial index for active contractors in market (RLS performance)
CREATE INDEX IF NOT EXISTS idx_contractors_market_active
ON contractors(market_id, is_active)
WHERE is_active = true;

COMMENT ON INDEX idx_contractors_contractor_code IS
'Index unique pour recherche rapide de prestataires par code. Permet recherche admin O(log n).';

COMMENT ON INDEX idx_contractors_market_id IS
'Index pour filtrage par marché. Utilisé par RLS policies pour isolation des données.';

COMMENT ON INDEX idx_contractors_market_active IS
'Index partiel pour requêtes fréquentes: prestataires actifs dans un marché donné.';

-- Verify columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'contractors'
      AND column_name = 'contractor_code'
  ) THEN
    RAISE EXCEPTION 'contractor_code column n''a pas été ajoutée à contractors';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'contractors'
      AND column_name = 'market_id'
  ) THEN
    RAISE EXCEPTION 'market_id column n''a pas été ajoutée à contractors';
  END IF;

  RAISE NOTICE 'Colonnes contractor_code et market_id ajoutées avec succès à la table contractors';
END $$;

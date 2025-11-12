-- Migration: Update contractor_applications table structure
-- Feature: 007-contractor-interface
-- Date: 2025-11-08
-- Description:
--   - Make motivation optional (remove NOT NULL)
--   - Add contractor_type (société/personnel)
--   - Split address into separate fields (street_address, city, postal_code, country)
--   - Replace preferred_schedule with available_dates JSONB
--   - Update validation trigger

-- ============================================================================
-- STEP 1: Make motivation optional
-- ============================================================================

ALTER TABLE contractor_applications
ALTER COLUMN motivation DROP NOT NULL;

COMMENT ON COLUMN contractor_applications.motivation IS 'Texte libre OPTIONNEL (minimum 100 caractères si fourni) expliquant la motivation du candidat';

-- ============================================================================
-- STEP 2: Add contractor_type field
-- ============================================================================

ALTER TABLE contractor_applications
ADD COLUMN contractor_type VARCHAR(50)
CHECK (contractor_type IN ('société', 'personnel'));

COMMENT ON COLUMN contractor_applications.contractor_type IS 'Type de structure: société (entreprise) ou personnel (auto-entrepreneur/particulier)';

-- ============================================================================
-- STEP 3: Add split address fields
-- ============================================================================

ALTER TABLE contractor_applications
ADD COLUMN street_address TEXT,
ADD COLUMN city VARCHAR(100),
ADD COLUMN postal_code VARCHAR(10),
ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT 'France';

COMMENT ON COLUMN contractor_applications.street_address IS 'Adresse complète (numéro, rue, complément)';
COMMENT ON COLUMN contractor_applications.city IS 'Ville du candidat';
COMMENT ON COLUMN contractor_applications.postal_code IS 'Code postal';
COMMENT ON COLUMN contractor_applications.country IS 'Pays (obligatoire, par défaut France)';

-- ============================================================================
-- STEP 4: Migrate existing address data (if any exists)
-- ============================================================================

-- Copy existing address to street_address for records that have an address
UPDATE contractor_applications
SET street_address = address
WHERE address IS NOT NULL;

-- ============================================================================
-- STEP 5: Drop old address column
-- ============================================================================

ALTER TABLE contractor_applications
DROP COLUMN address;

-- ============================================================================
-- STEP 6: Add available_dates JSONB and drop preferred_schedule
-- ============================================================================

ALTER TABLE contractor_applications
ADD COLUMN available_dates JSONB;

COMMENT ON COLUMN contractor_applications.available_dates IS 'Dates de disponibilité au format JSON: [{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}]';

ALTER TABLE contractor_applications
DROP COLUMN IF EXISTS preferred_schedule;

-- ============================================================================
-- STEP 7: Update validation trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION check_contractor_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Si motivation fournie, vérifier longueur minimum
  IF NEW.motivation IS NOT NULL AND LENGTH(NEW.motivation) < 100 THEN
    RAISE EXCEPTION 'La motivation doit contenir au moins 100 caractères si elle est fournie';
  END IF;

  -- Vérifier motif de refus obligatoire
  IF NEW.status = 'rejected' AND (NEW.rejection_reason IS NULL OR LENGTH(NEW.rejection_reason) < 10) THEN
    RAISE EXCEPTION 'Un motif de refus est obligatoire (minimum 10 caractères)';
  END IF;

  -- Vérifier que le pays est bien fourni
  IF NEW.country IS NULL OR TRIM(NEW.country) = '' THEN
    RAISE EXCEPTION 'Le pays est obligatoire';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists, no need to recreate
-- It will automatically use the updated function

-- ============================================================================
-- Verification queries (for manual testing)
-- ============================================================================

-- Verify table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'contractor_applications'
-- ORDER BY ordinal_position;

-- Verify trigger function
-- SELECT pg_get_functiondef('check_contractor_application'::regproc);

-- Migration: Add client_code column to profiles table
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Step 1: Add nullable column (allows existing records to remain valid)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS client_code VARCHAR(10) UNIQUE;

COMMENT ON COLUMN profiles.client_code IS
'Code unique du client (format CLI-XXXXXX). Généré automatiquement via trigger lors de l''insertion.';

-- Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_client_code
ON profiles(client_code)
WHERE client_code IS NOT NULL;

COMMENT ON INDEX idx_profiles_client_code IS
'Index unique pour recherche rapide de clients par code. Permet recherche admin O(log n).';

-- Verify column was added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'client_code'
  ) THEN
    RAISE EXCEPTION 'client_code column n''a pas été ajoutée à profiles';
  END IF;

  RAISE NOTICE 'Colonne client_code ajoutée avec succès à la table profiles';
END $$;

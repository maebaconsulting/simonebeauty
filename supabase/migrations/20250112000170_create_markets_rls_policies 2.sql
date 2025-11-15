-- Migration: Create RLS policies for markets table
-- Feature: 018-international-market-segmentation
-- Date: 2025-01-12

-- Enable RLS on markets table
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can view active markets
CREATE POLICY "Public can view active markets"
ON markets FOR SELECT
USING (is_active = true);

COMMENT ON POLICY "Public can view active markets" ON markets IS
'Tous les utilisateurs peuvent voir les marchés actifs pour découvrir les services disponibles';

-- Policy 2: Admins can manage all markets
CREATE POLICY "Admins can manage markets"
ON markets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

COMMENT ON POLICY "Admins can manage markets" ON markets IS
'Administrateurs et managers ont accès complet aux marchés (lecture, création, mise à jour, suppression)';

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'markets') THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur la table markets';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'markets'
    AND policyname = 'Public can view active markets'
  ) THEN
    RAISE EXCEPTION 'Policy "Public can view active markets" n''a pas été créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'markets'
    AND policyname = 'Admins can manage markets'
  ) THEN
    RAISE EXCEPTION 'Policy "Admins can manage markets" n''a pas été créée';
  END IF;

  RAISE NOTICE 'RLS activé sur markets avec 2 policies créées avec succès';
END $$;

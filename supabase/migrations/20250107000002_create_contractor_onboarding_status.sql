-- Migration: 20250107000002_create_contractor_onboarding_status.sql
-- Feature: 007 - Contractor Interface
-- Description: Create contractor onboarding status table with computed columns, indexes, RLS, and completion trigger
-- Date: 2025-11-07

CREATE TABLE contractor_onboarding_status (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id UUID UNIQUE NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Étapes de l'onboarding
  account_created BOOLEAN DEFAULT true, -- Always true once record exists
  schedule_configured BOOLEAN DEFAULT false,
  stripe_connect_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,

  -- Progression
  completion_percentage INT GENERATED ALWAYS AS (
    (
      CASE WHEN account_created THEN 25 ELSE 0 END +
      CASE WHEN schedule_configured THEN 25 ELSE 0 END +
      CASE WHEN stripe_connect_completed THEN 25 ELSE 0 END +
      CASE WHEN profile_completed THEN 25 ELSE 0 END
    )
  ) STORED,

  -- Onboarding terminé
  is_completed BOOLEAN GENERATED ALWAYS AS (
    schedule_configured AND stripe_connect_completed AND profile_completed
  ) STORED,

  -- Timestamps
  schedule_configured_at TIMESTAMP,
  stripe_connect_completed_at TIMESTAMP,
  profile_completed_at TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_onboarding_status IS 'État de complétion de l''onboarding obligatoire pour les nouveaux prestataires';
COMMENT ON COLUMN contractor_onboarding_status.schedule_configured IS 'Vrai si le prestataire a configuré ses horaires de travail';
COMMENT ON COLUMN contractor_onboarding_status.stripe_connect_completed IS 'Vrai si le compte Stripe Connect est vérifié et opérationnel';
COMMENT ON COLUMN contractor_onboarding_status.profile_completed IS 'Vrai si le profil professionnel (bio, spécialités) est rempli';
COMMENT ON COLUMN contractor_onboarding_status.completion_percentage IS 'Pourcentage de complétion calculé automatiquement (0-100)';
COMMENT ON COLUMN contractor_onboarding_status.is_completed IS 'Vrai si toutes les étapes sont terminées (permet d''accepter des réservations)';

-- Indexes
CREATE INDEX idx_contractor_onboarding_contractor ON contractor_onboarding_status(contractor_id);
CREATE INDEX idx_contractor_onboarding_incomplete ON contractor_onboarding_status(is_completed) WHERE is_completed = false;

-- RLS Policies
ALTER TABLE contractor_onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own onboarding status"
ON contractor_onboarding_status FOR SELECT
TO authenticated
USING (
  contractor_id = auth.uid()
);

CREATE POLICY "Admins can view all onboarding status"
ON contractor_onboarding_status FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger: update completed_at when all steps done
CREATE OR REPLACE FUNCTION update_onboarding_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed AND OLD.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_onboarding_completed_at
BEFORE UPDATE ON contractor_onboarding_status
FOR EACH ROW EXECUTE FUNCTION update_onboarding_completion();

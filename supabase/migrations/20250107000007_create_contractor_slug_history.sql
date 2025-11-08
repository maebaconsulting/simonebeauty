-- Migration: 20250107000007_create_contractor_slug_history.sql
-- Feature: 007 - Contractor Interface
-- Description: Create contractor slug history table with indexes, RLS, and unique constraint
-- Date: 2025-11-07

CREATE TABLE contractor_slug_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Slugs
  old_slug VARCHAR(50) NOT NULL,
  new_slug VARCHAR(50) NOT NULL,

  -- Durée de vie de la redirection
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  is_active BOOLEAN DEFAULT true,

  -- Métadonnées
  change_reason VARCHAR(255), -- Optionnel: pourquoi le prestataire a changé
  changed_by_admin BOOLEAN DEFAULT false -- True si changement forcé par admin
);

COMMENT ON TABLE contractor_slug_history IS 'Historique des changements de slug pour maintenir des redirections temporaires (30 jours)';
COMMENT ON COLUMN contractor_slug_history.old_slug IS 'Ancien slug qui doit être redirigé';
COMMENT ON COLUMN contractor_slug_history.new_slug IS 'Nouveau slug vers lequel rediriger';
COMMENT ON COLUMN contractor_slug_history.expires_at IS 'Date d''expiration de la redirection (30 jours après changement)';
COMMENT ON COLUMN contractor_slug_history.is_active IS 'Si false, la redirection n''est plus active (après expiration ou suppression manuelle)';
COMMENT ON COLUMN contractor_slug_history.changed_by_admin IS 'True si un admin a forcé le changement de slug (ex: slug inapproprié)';

-- Indexes
CREATE INDEX idx_contractor_slug_history_contractor ON contractor_slug_history(contractor_id);
CREATE UNIQUE INDEX idx_contractor_slug_history_old_slug_active ON contractor_slug_history(old_slug) WHERE is_active = true;

-- RLS Policies
ALTER TABLE contractor_slug_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own slug history"
ON contractor_slug_history FOR SELECT
TO authenticated
USING (
  contractor_id = auth.uid()
);

CREATE POLICY "Admins can view all slug history"
ON contractor_slug_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Cleanup job (run daily via cron)
-- DELETE FROM contractor_slug_history WHERE expires_at < NOW();

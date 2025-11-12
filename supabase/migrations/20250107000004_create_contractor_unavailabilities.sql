-- Migration: Create contractor_unavailabilities table
-- Feature: 007-contractor-interface
-- Description: Créneaux spécifiques bloqués par les prestataires (congés, pauses, rendez-vous personnels)

CREATE TABLE contractor_unavailabilities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Date et horaires
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,

  -- Raison
  reason VARCHAR(255),
  reason_type VARCHAR(50) CHECK (reason_type IN ('vacation', 'personal', 'lunch_break', 'sick', 'other')),

  -- Récurrence (pour pauses déjeuner quotidiennes par exemple)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Contrainte: start < end
  CONSTRAINT valid_datetime_range CHECK (start_datetime < end_datetime)
);

COMMENT ON TABLE contractor_unavailabilities IS 'Créneaux spécifiques bloqués par les prestataires (congés, pauses, rendez-vous personnels)';
COMMENT ON COLUMN contractor_unavailabilities.start_datetime IS 'Date et heure de début de l''indisponibilité';
COMMENT ON COLUMN contractor_unavailabilities.end_datetime IS 'Date et heure de fin de l''indisponibilité';
COMMENT ON COLUMN contractor_unavailabilities.reason_type IS 'Type d''indisponibilité: vacation (congés), personal (RDV perso), lunch_break (pause déjeuner), sick (maladie), other';
COMMENT ON COLUMN contractor_unavailabilities.is_recurring IS 'Si true, l''indisponibilité se répète selon recurrence_pattern';
COMMENT ON COLUMN contractor_unavailabilities.recurrence_pattern IS 'Schéma de récurrence: daily (chaque jour), weekly (chaque semaine), monthly (chaque mois)';

-- Indexes
CREATE INDEX idx_contractor_unavailabilities_contractor ON contractor_unavailabilities(contractor_id);
CREATE INDEX idx_contractor_unavailabilities_dates ON contractor_unavailabilities(contractor_id, start_datetime, end_datetime) WHERE is_active = true;

-- RLS Policies
ALTER TABLE contractor_unavailabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own unavailabilities"
ON contractor_unavailabilities FOR ALL
TO authenticated
USING (
  contractor_id IN (
    SELECT id FROM contractors WHERE profile_uuid = auth.uid()
  )
);

CREATE POLICY "Admins can view all unavailabilities"
ON contractor_unavailabilities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

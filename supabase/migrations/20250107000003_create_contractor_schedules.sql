-- Migration: 20250107000003_create_contractor_schedules.sql
-- Feature: 007 - Contractor Interface
-- Description: Create contractor schedules table with indexes, RLS, and unique constraint
-- Date: 2025-11-07

CREATE TABLE contractor_schedules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Jour et horaires
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = dimanche, 6 = samedi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Récurrence
  is_recurring BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE, -- NULL = indéfini

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Contrainte: start_time < end_time
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

COMMENT ON TABLE contractor_schedules IS 'Horaires de travail hebdomadaires configurés par les prestataires';
COMMENT ON COLUMN contractor_schedules.day_of_week IS 'Jour de la semaine (0=dimanche, 1=lundi, ..., 6=samedi)';
COMMENT ON COLUMN contractor_schedules.start_time IS 'Heure de début de disponibilité (ex: 09:00:00)';
COMMENT ON COLUMN contractor_schedules.end_time IS 'Heure de fin de disponibilité (ex: 18:00:00)';
COMMENT ON COLUMN contractor_schedules.is_recurring IS 'Si true, l''horaire se répète chaque semaine';
COMMENT ON COLUMN contractor_schedules.effective_from IS 'Date à partir de laquelle l''horaire est valide';
COMMENT ON COLUMN contractor_schedules.effective_until IS 'Date jusqu''à laquelle l''horaire est valide (NULL = indéfini)';

-- Indexes
CREATE INDEX idx_contractor_schedules_contractor ON contractor_schedules(contractor_id);
CREATE INDEX idx_contractor_schedules_day ON contractor_schedules(contractor_id, day_of_week) WHERE is_active = true;

-- Unique constraint: pas de chevauchement d'horaires pour le même jour
CREATE UNIQUE INDEX idx_contractor_schedules_unique ON contractor_schedules(
  contractor_id,
  day_of_week,
  start_time,
  end_time
) WHERE is_active = true;

-- RLS Policies
ALTER TABLE contractor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own schedules"
ON contractor_schedules FOR ALL
TO authenticated
USING (
  contractor_id = auth.uid()
);

CREATE POLICY "Admins can view all schedules"
ON contractor_schedules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

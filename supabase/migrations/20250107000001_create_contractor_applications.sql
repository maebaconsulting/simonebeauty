-- Migration: 20250107000001_create_contractor_applications.sql
-- Feature: 007 - Contractor Interface
-- Description: Create contractor applications table with multi-step form fields, RLS policies, and validation trigger
-- Date: 2025-11-07

CREATE TABLE contractor_applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Étape 1: Informations personnelles
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,

  -- Étape 2: Profil professionnel
  profession VARCHAR(100) NOT NULL,
  years_of_experience INT NOT NULL CHECK (years_of_experience >= 0),
  diplomas TEXT,
  specialties BIGINT[] NOT NULL, -- Array of specialty IDs
  services_offered TEXT NOT NULL,

  -- Étape 3: Disponibilités et zones
  geographic_zones TEXT[] NOT NULL, -- Array of zones (arrondissements, villes)
  preferred_schedule TEXT,
  work_frequency VARCHAR(50) CHECK (work_frequency IN ('full_time', 'part_time', 'occasional')),

  -- Étape 4: Motivation
  motivation TEXT NOT NULL CHECK (LENGTH(motivation) >= 100),

  -- Étape 5: Documents
  cv_file_path TEXT,
  certifications_file_paths TEXT[], -- Array of file paths
  portfolio_file_paths TEXT[], -- Array of file paths

  -- Statut de la candidature
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'interview_scheduled', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT NOW(),

  -- Admin review
  admin_comments TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP,

  -- Entretien
  interview_date TIMESTAMP,
  interview_mode VARCHAR(50) CHECK (interview_mode IN ('video', 'phone', 'in_person')),
  interview_notes TEXT,

  -- Refus
  rejection_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_applications IS 'Candidatures de prestataires soumises via le formulaire multi-étapes';
COMMENT ON COLUMN contractor_applications.specialties IS 'IDs des spécialités sélectionnées (relation avec table specialties)';
COMMENT ON COLUMN contractor_applications.geographic_zones IS 'Zones d''intervention souhaitées (ex: ["75001", "75002", "Boulogne-Billancourt"])';
COMMENT ON COLUMN contractor_applications.motivation IS 'Texte libre minimum 100 caractères expliquant la motivation du candidat';
COMMENT ON COLUMN contractor_applications.cv_file_path IS 'Chemin du fichier CV dans Supabase Storage (bucket: job-applications/cv/)';
COMMENT ON COLUMN contractor_applications.certifications_file_paths IS 'Chemins des fichiers de certifications dans Supabase Storage';
COMMENT ON COLUMN contractor_applications.portfolio_file_paths IS 'Chemins des photos de réalisations dans Supabase Storage';
COMMENT ON COLUMN contractor_applications.status IS 'Statut: pending (en attente), interview_scheduled (entretien planifié), approved (validé), rejected (refusé)';
COMMENT ON COLUMN contractor_applications.rejection_reason IS 'Motif de refus obligatoire si status = rejected';

-- Indexes
CREATE INDEX idx_contractor_applications_status ON contractor_applications(status, submitted_at DESC);
CREATE INDEX idx_contractor_applications_email ON contractor_applications(email);

-- RLS Policies
ALTER TABLE contractor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all applications"
ON contractor_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update applications"
ON contractor_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Validation trigger: reject if motivation too short
CREATE OR REPLACE FUNCTION check_contractor_application()
RETURNS TRIGGER AS $$
BEGIN
  IF LENGTH(NEW.motivation) < 100 THEN
    RAISE EXCEPTION 'La motivation doit contenir au moins 100 caractères';
  END IF;

  IF NEW.status = 'rejected' AND (NEW.rejection_reason IS NULL OR LENGTH(NEW.rejection_reason) < 10) THEN
    RAISE EXCEPTION 'Un motif de refus est obligatoire (minimum 10 caractères)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_contractor_application
BEFORE INSERT OR UPDATE ON contractor_applications
FOR EACH ROW EXECUTE FUNCTION check_contractor_application();

-- Migration: 20250107000005_create_contractor_profiles.sql
-- Feature: 007 - Contractor Interface
-- Description: Create contractor profiles table and junction table for specialties with indexes and RLS
-- Date: 2025-11-07

CREATE TABLE contractor_profiles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contractor_id UUID UNIQUE NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Informations publiques
  bio TEXT,
  professional_title VARCHAR(200), -- Ex: "Masseuse professionnelle certifiée"
  years_of_experience INT CHECK (years_of_experience >= 0),

  -- Spécialités (many-to-many via junction table contractor_profile_specialties)
  -- Handled separately

  -- Portfolio
  portfolio_image_paths TEXT[], -- Paths in Supabase Storage
  certification_paths TEXT[], -- Paths to diplomas/certifications
  certifications_verified BOOLEAN DEFAULT false, -- Admin verification

  -- Zone d'intervention
  service_area_center TEXT, -- Adresse de base
  service_radius_km INT DEFAULT 10, -- Rayon en km
  postal_codes TEXT[], -- Codes postaux couverts

  -- Affichage
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Mis en avant dans les recherches

  -- Métadonnées
  profile_completeness_percentage INT DEFAULT 0,
  last_profile_update TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contractor_profiles IS 'Profils professionnels publics des prestataires visibles par les clients';
COMMENT ON COLUMN contractor_profiles.bio IS 'Description professionnelle rédigée par le prestataire (max 500 caractères recommandé)';
COMMENT ON COLUMN contractor_profiles.professional_title IS 'Titre professionnel affiché (ex: Masseuse certifiée, Coiffeur à domicile)';
COMMENT ON COLUMN contractor_profiles.portfolio_image_paths IS 'Chemins des photos de réalisations dans Supabase Storage (max 10 recommandé)';
COMMENT ON COLUMN contractor_profiles.certifications_verified IS 'Si true, les diplômes ont été vérifiés par un administrateur (badge visible)';
COMMENT ON COLUMN contractor_profiles.service_area_center IS 'Adresse centrale du prestataire pour calculer les distances';
COMMENT ON COLUMN contractor_profiles.service_radius_km IS 'Rayon d''intervention en kilomètres depuis le centre';
COMMENT ON COLUMN contractor_profiles.postal_codes IS 'Liste des codes postaux couverts (ex: ["75001", "75002", "92100"])';
COMMENT ON COLUMN contractor_profiles.is_visible IS 'Si false, le profil n''apparaît pas dans les recherches clients';
COMMENT ON COLUMN contractor_profiles.is_featured IS 'Si true, le profil est mis en avant dans les résultats de recherche';
COMMENT ON COLUMN contractor_profiles.profile_completeness_percentage IS 'Pourcentage de complétion du profil (0-100) pour encourager la complétion';

-- Indexes
CREATE INDEX idx_contractor_profiles_contractor ON contractor_profiles(contractor_id);
CREATE INDEX idx_contractor_profiles_visible ON contractor_profiles(is_visible, is_featured);

-- RLS Policies
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible profiles"
ON contractor_profiles FOR SELECT
TO public
USING (is_visible = true);

CREATE POLICY "Contractors can update own profile"
ON contractor_profiles FOR UPDATE
TO authenticated
USING (
  contractor_id = auth.uid()
);

CREATE POLICY "Admins can manage all profiles"
ON contractor_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Junction table: contractor_profile_specialties
CREATE TABLE contractor_profile_specialties (
  contractor_profile_id BIGINT NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  specialty_id BIGINT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (contractor_profile_id, specialty_id)
);

COMMENT ON TABLE contractor_profile_specialties IS 'Table de liaison many-to-many entre profils prestataires et spécialités';

CREATE INDEX idx_contractor_profile_specialties_profile ON contractor_profile_specialties(contractor_profile_id);
CREATE INDEX idx_contractor_profile_specialties_specialty ON contractor_profile_specialties(specialty_id);

ALTER TABLE contractor_profile_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profile specialties"
ON contractor_profile_specialties FOR SELECT
TO public
USING (true);

CREATE POLICY "Contractors can manage own profile specialties"
ON contractor_profile_specialties FOR ALL
TO authenticated
USING (
  contractor_profile_id IN (
    SELECT cp.id FROM contractor_profiles cp
    WHERE cp.contractor_id = auth.uid()
  )
);

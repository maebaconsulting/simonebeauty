-- Migration: Create specialties table
-- Feature: 007-contractor-interface
-- Description: Spécialités prédéfinies disponibles pour les prestataires selon leur profession

CREATE TABLE specialties (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('massage', 'beauty', 'hair', 'health', 'other')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE specialties IS 'Spécialités prédéfinies disponibles pour les prestataires selon leur profession';
COMMENT ON COLUMN specialties.name IS 'Nom de la spécialité (ex: Massage Suédois, Coupe Femme)';
COMMENT ON COLUMN specialties.category IS 'Catégorie professionnelle: massage/beauté/coiffure/santé/autre';
COMMENT ON COLUMN specialties.description IS 'Description détaillée de la spécialité pour aider les candidats';
COMMENT ON COLUMN specialties.is_active IS 'Si false, la spécialité n''apparaît plus dans les formulaires';
COMMENT ON COLUMN specialties.display_order IS 'Ordre d''affichage dans les listes (0 = premier)';

-- Indexes
CREATE INDEX idx_specialties_category ON specialties(category) WHERE is_active = true;
CREATE INDEX idx_specialties_active ON specialties(is_active, display_order);

-- RLS Policies
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active specialties"
ON specialties FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage specialties"
ON specialties FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Seed data examples
INSERT INTO specialties (name, category, display_order) VALUES
('Massage Suédois', 'massage', 1),
('Massage Deep Tissue', 'massage', 2),
('Massage Thaï', 'massage', 3),
('Massage Californien', 'massage', 4),
('Maquillage', 'beauty', 1),
('Manucure', 'beauty', 2),
('Pédicure', 'beauty', 3),
('Épilation', 'beauty', 4),
('Coupe Femme', 'hair', 1),
('Coupe Homme', 'hair', 2),
('Coloration', 'hair', 3),
('Brushing', 'hair', 4);

-- Migration: 20250107100000_add_service_categories.sql
-- Feature: Service Categories Hierarchy
-- Description: Add hierarchical category system for services (categories + subcategories)
-- Date: 2025-11-07

-- =============================================================================
-- 1. Create service_categories table (hierarchical)
-- =============================================================================

CREATE TABLE service_categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  parent_id BIGINT REFERENCES service_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  icon VARCHAR(50), -- Emoji ou icon name (ex: "scissors", "💇")
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_category_slug UNIQUE(slug),
  CONSTRAINT check_no_self_reference CHECK (id != parent_id)
);

COMMENT ON TABLE service_categories IS 'Catégories et sous-catégories de services avec hiérarchie parent/enfant';
COMMENT ON COLUMN service_categories.parent_id IS 'ID de la catégorie parente (NULL pour catégories principales)';
COMMENT ON COLUMN service_categories.name IS 'Nom de la catégorie (ex: COIFFURE, LA COUPE)';
COMMENT ON COLUMN service_categories.slug IS 'Identifiant URL unique (ex: coiffure, la-coupe)';
COMMENT ON COLUMN service_categories.icon IS 'Emoji ou nom d''icône pour affichage (ex: 💇, scissors)';
COMMENT ON COLUMN service_categories.display_order IS 'Ordre d''affichage dans les listes (0 = premier)';

-- Indexes
CREATE INDEX idx_service_categories_parent ON service_categories(parent_id);
CREATE INDEX idx_service_categories_active ON service_categories(is_active, display_order);
CREATE INDEX idx_service_categories_slug ON service_categories(slug);

-- RLS Policies
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
ON service_categories FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON service_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- 2. Add category/subcategory columns to services table
-- =============================================================================

-- Add new columns
ALTER TABLE services
  ADD COLUMN category_id BIGINT REFERENCES service_categories(id) ON DELETE SET NULL,
  ADD COLUMN subcategory_id BIGINT REFERENCES service_categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN services.category_id IS 'Catégorie principale du service (ex: COIFFURE)';
COMMENT ON COLUMN services.subcategory_id IS 'Sous-catégorie du service (ex: LA COUPE)';

-- Add index for category lookups (drop first if exists to avoid conflicts)
DROP INDEX IF EXISTS idx_services_category;
DROP INDEX IF EXISTS idx_services_subcategory;
CREATE INDEX idx_services_category ON services(category_id) WHERE is_active = true;
CREATE INDEX idx_services_subcategory ON services(subcategory_id) WHERE is_active = true;

-- =============================================================================
-- 3. Seed data: Main categories (8 categories from liste_services.md)
-- =============================================================================

INSERT INTO service_categories (name, slug, icon, display_order) VALUES
('COIFFURE', 'coiffure', '💇', 1),
('BEAUTE DES ONGLES', 'beaute-des-ongles', '💅', 2),
('LE VISAGE', 'le-visage', '🌸', 3),
('LE REGARD', 'le-regard', '👁️', 4),
('MASSAGE BIEN-ETRE', 'massage-bien-etre', '💆', 5),
('MINCEUR & DRAINAGE', 'minceur-drainage', '🏃', 6),
('EPILATION', 'epilation', '🪒', 7),
('MAQUILLAGE', 'maquillage', '💄', 8);

-- =============================================================================
-- 4. Seed data: Subcategories (40 subcategories from liste_services.md)
-- =============================================================================

-- COIFFURE subcategories (8)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'BALAYAGE', 'coiffure-balayage', 1),
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'BRUSHING', 'coiffure-brushing', 2),
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'COIFFAGES', 'coiffure-coiffages', 3),
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'COULEUR', 'coiffure-couleur', 4),
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'ENTRETIEN DES CHEVEUX', 'coiffure-entretien', 5),
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'LA COUPE', 'coiffure-la-coupe', 6),
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'LISSAGE ET SOINS', 'coiffure-lissage-soins', 7),
((SELECT id FROM service_categories WHERE slug = 'coiffure'), 'TECHNIQUES', 'coiffure-techniques', 8);

-- BEAUTE DES ONGLES subcategories (6)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'beaute-des-ongles'), 'DELUXE RITUEL KURE BAZAAR', 'ongles-deluxe-rituel', 1),
((SELECT id FROM service_categories WHERE slug = 'beaute-des-ongles'), 'FORFAIT MAINS / PIEDS', 'ongles-forfait-mains-pieds', 2),
((SELECT id FROM service_categories WHERE slug = 'beaute-des-ongles'), 'LES MAINS', 'ongles-les-mains', 3),
((SELECT id FROM service_categories WHERE slug = 'beaute-des-ongles'), 'LES PIEDS', 'ongles-les-pieds', 4),
((SELECT id FROM service_categories WHERE slug = 'beaute-des-ongles'), 'MANI EXPRESS', 'ongles-mani-express', 5),
((SELECT id FROM service_categories WHERE slug = 'beaute-des-ongles'), 'PEDI EXPRESS', 'ongles-pedi-express', 6);

-- LE VISAGE subcategories (5)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'le-visage'), '10 ANS DE MOINS', 'visage-10-ans-de-moins', 1),
((SELECT id FROM service_categories WHERE slug = 'le-visage'), 'BELLE PEAU', 'visage-belle-peau', 2),
((SELECT id FROM service_categories WHERE slug = 'le-visage'), 'CORPS & VISAGE', 'visage-corps-visage', 3),
((SELECT id FROM service_categories WHERE slug = 'le-visage'), 'DU GALBE !', 'visage-du-galbe', 4),
((SELECT id FROM service_categories WHERE slug = 'le-visage'), 'VISAGE TONIQUE', 'visage-tonique', 5);

-- LE REGARD subcategories (3)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'le-regard'), 'CILS DE BICHE', 'regard-cils-de-biche', 1),
((SELECT id FROM service_categories WHERE slug = 'le-regard'), 'LES COMBOS', 'regard-les-combos', 2),
((SELECT id FROM service_categories WHERE slug = 'le-regard'), 'SOURCILS PARFAITS', 'regard-sourcils-parfaits', 3);

-- MASSAGE BIEN-ETRE subcategories (6)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'), 'ADDICT (j''ai une table chez moi!)', 'massage-addict', 1),
((SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'), 'A PARTAGER ✌️ : LE AMMA ASSIS', 'massage-amma-assis', 2),
((SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'), 'AU NIRVANA', 'massage-au-nirvana', 3),
((SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'), 'LES CLASSIQUES', 'massage-les-classiques', 4),
((SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'), 'LES CURES 10 SEANCES !', 'massage-cures-10-seances', 5),
((SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'), 'LES THEMATIQUES', 'massage-thematiques', 6);

-- MINCEUR & DRAINAGE subcategories (6)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'minceur-drainage'), 'FOCUS FERMETE', 'minceur-focus-fermete', 1),
((SELECT id FROM service_categories WHERE slug = 'minceur-drainage'), 'LE DRAINAGE', 'minceur-le-drainage', 2),
((SELECT id FROM service_categories WHERE slug = 'minceur-drainage'), 'LE REMODELAGE', 'minceur-le-remodelage', 3),
((SELECT id FROM service_categories WHERE slug = 'minceur-drainage'), 'LES CURES 5 SEANCES !', 'minceur-cures-5-seances', 4),
((SELECT id FROM service_categories WHERE slug = 'minceur-drainage'), 'MINCEUR', 'minceur-minceur', 5),
((SELECT id FROM service_categories WHERE slug = 'minceur-drainage'), 'UNE SEANCE SUR MESURE', 'minceur-sur-mesure', 6);

-- EPILATION subcategories (5)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'epilation'), 'A LA CIRE', 'epilation-a-la-cire', 1),
((SELECT id FROM service_categories WHERE slug = 'epilation'), 'FORFAIT DEMI-JAMBES', 'epilation-forfait-demi-jambes', 2),
((SELECT id FROM service_categories WHERE slug = 'epilation'), 'FORFAIT JAMBES ENTIERES', 'epilation-forfait-jambes-entieres', 3),
((SELECT id FROM service_categories WHERE slug = 'epilation'), 'MAILLOT XL', 'epilation-maillot-xl', 4),
((SELECT id FROM service_categories WHERE slug = 'epilation'), 'UNE ZONE', 'epilation-une-zone', 5);

-- MAQUILLAGE subcategories (1)
INSERT INTO service_categories (parent_id, name, slug, display_order) VALUES
((SELECT id FROM service_categories WHERE slug = 'maquillage'), 'MAQUILLAGE', 'maquillage-maquillage', 1);

-- =============================================================================
-- 5. Migrate existing services to use new category system
-- =============================================================================

-- Map old category enum values to new category_id
-- Note: This requires manual mapping based on existing services data
-- For now, we'll map the generic categories to the main categories

UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre') WHERE category = 'massage';
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'beaute-des-ongles') WHERE category = 'beauty';
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'coiffure') WHERE category = 'hair';
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'le-visage') WHERE category = 'health';
UPDATE services SET category_id = (SELECT id FROM service_categories WHERE slug = 'maquillage') WHERE category = 'other';

-- =============================================================================
-- 6. Drop old category CHECK constraint (keep column for backward compat)
-- =============================================================================

-- Remove the CHECK constraint to allow flexibility
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_check;

-- Keep the old 'category' column as VARCHAR for backward compatibility
-- It can be removed in a future migration once all code is updated
COMMENT ON COLUMN services.category IS 'DEPRECATED: Use category_id instead. Kept for backward compatibility.';

-- =============================================================================
-- 7. Create helper view for services with full category path
-- =============================================================================

CREATE VIEW services_with_categories AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.description,
  s.base_price,
  s.base_duration_minutes,
  s.image_url,
  s.is_active,
  s.display_order,

  -- Main category
  cat.id AS category_id,
  cat.name AS category_name,
  cat.slug AS category_slug,
  cat.icon AS category_icon,

  -- Subcategory
  subcat.id AS subcategory_id,
  subcat.name AS subcategory_name,
  subcat.slug AS subcategory_slug,

  -- Full path for display
  CASE
    WHEN subcat.name IS NOT NULL THEN cat.name || ' > ' || subcat.name
    ELSE cat.name
  END AS full_category_path,

  s.created_at,
  s.updated_at
FROM services s
LEFT JOIN service_categories cat ON s.category_id = cat.id
LEFT JOIN service_categories subcat ON s.subcategory_id = subcat.id;

COMMENT ON VIEW services_with_categories IS 'Services avec informations complètes de catégorie et sous-catégorie';

GRANT SELECT ON services_with_categories TO authenticated;
GRANT SELECT ON services_with_categories TO anon;

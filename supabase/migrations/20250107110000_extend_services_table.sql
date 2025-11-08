-- Migration: 20250107110000_extend_services_table.sql
-- Feature: Extend services table with fields from legacy product table
-- Description: Add detailed service information, client targeting, media, and session management
-- Date: 2025-11-07
-- Reference: legacy_product.md (columns from old application)

-- =============================================================================
-- 1. Add Detailed Service Information Columns
-- =============================================================================

ALTER TABLE services
  -- Short introduction (1-2 sentences for cards/previews)
  ADD COLUMN intro TEXT,

  -- Detailed description (full content for service page)
  ADD COLUMN long_description TEXT,

  -- Professional information for clients
  ADD COLUMN hygienic_precautions TEXT,
  ADD COLUMN contraindications TEXT,
  ADD COLUMN advises TEXT,

  -- Session details
  ADD COLUMN your_session TEXT, -- Déroulement de la séance
  ADD COLUMN preparation TEXT,  -- Comment se préparer
  ADD COLUMN suggestion TEXT;   -- Suggestions complémentaires

COMMENT ON COLUMN services.intro IS 'Introduction courte (1-2 phrases) pour aperçu rapide';
COMMENT ON COLUMN services.long_description IS 'Description détaillée complète du service';
COMMENT ON COLUMN services.hygienic_precautions IS 'Précautions d''hygiène à respecter';
COMMENT ON COLUMN services.contraindications IS 'Contre-indications médicales (grossesse, allergies, etc.)';
COMMENT ON COLUMN services.advises IS 'Conseils post-service (hydratation, repos, etc.)';
COMMENT ON COLUMN services.your_session IS 'Déroulement détaillé de la séance étape par étape';
COMMENT ON COLUMN services.preparation IS 'Comment se préparer avant la séance';
COMMENT ON COLUMN services.suggestion IS 'Suggestions de services complémentaires';

-- =============================================================================
-- 2. Add Client Targeting Columns
-- =============================================================================

ALTER TABLE services
  ADD COLUMN for_men BOOLEAN DEFAULT false,
  ADD COLUMN for_women BOOLEAN DEFAULT false,
  ADD COLUMN for_kids BOOLEAN DEFAULT false;

COMMENT ON COLUMN services.for_men IS 'Service adapté/recommandé pour hommes';
COMMENT ON COLUMN services.for_women IS 'Service adapté/recommandé pour femmes';
COMMENT ON COLUMN services.for_kids IS 'Service adapté/recommandé pour enfants';

-- =============================================================================
-- 3. Add Business/Enterprise Features
-- =============================================================================

ALTER TABLE services
  ADD COLUMN is_for_entreprise_ready BOOLEAN DEFAULT false;

COMMENT ON COLUMN services.is_for_entreprise_ready IS 'Service disponible pour prestations en entreprise (bien-être au bureau, événements corporate)';

-- =============================================================================
-- 4. Add Session Management (Cures/Forfaits)
-- =============================================================================

ALTER TABLE services
  ADD COLUMN has_many_session BOOLEAN DEFAULT false,
  ADD COLUMN number_of_session SMALLINT DEFAULT 1;

COMMENT ON COLUMN services.has_many_session IS 'Service vendu en cure/forfait multiple séances';
COMMENT ON COLUMN services.number_of_session IS 'Nombre de séances incluses dans le forfait (défaut: 1)';

-- Add constraint: if has_many_session=true, number_of_session must be > 1
ALTER TABLE services
  ADD CONSTRAINT check_session_count CHECK (
    (has_many_session = false AND number_of_session = 1) OR
    (has_many_session = true AND number_of_session > 1)
  );

-- =============================================================================
-- 5. Add Service Type Flags
-- =============================================================================

ALTER TABLE services
  ADD COLUMN is_additional_service BOOLEAN DEFAULT false;

COMMENT ON COLUMN services.is_additional_service IS 'Service additionnel (peut être ajouté à un autre service, ex: gommage avec massage)';

-- =============================================================================
-- 6. Add Media Columns
-- =============================================================================

ALTER TABLE services
  ADD COLUMN secondary_image_urls TEXT[] DEFAULT '{}',
  ADD COLUMN video_url TEXT;

COMMENT ON COLUMN services.secondary_image_urls IS 'URLs des images supplémentaires pour galerie (array)';
COMMENT ON COLUMN services.video_url IS 'URL vidéo de présentation du service (YouTube, Vimeo, etc.)';

-- =============================================================================
-- 7. Add Tags for Filtering/Search
-- =============================================================================

ALTER TABLE services
  ADD COLUMN tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN services.tags IS 'Tags pour recherche et filtrage (ex: ["relaxant", "anti-stress", "detox"])';

-- Create GIN index for array search (fast tag lookups)
CREATE INDEX idx_services_tags ON services USING GIN(tags);

-- =============================================================================
-- 8. Add Cost Price (for margin calculation)
-- =============================================================================

ALTER TABLE services
  ADD COLUMN cost_price DECIMAL(10, 2);

COMMENT ON COLUMN services.cost_price IS 'Prix de revient/coût du service (pour calcul de marge). NULL si non applicable.';

-- =============================================================================
-- 9. Rename existing columns for clarity (backward compatible)
-- =============================================================================

-- Keep base_price and base_duration_minutes as is (already good names)
-- Add comments for clarity
COMMENT ON COLUMN services.base_price IS 'Prix de vente public en euros (peut être personnalisé par prestataire via contractor_services)';
COMMENT ON COLUMN services.base_duration_minutes IS 'Durée standard en minutes (peut être personnalisée par prestataire)';
COMMENT ON COLUMN services.image_url IS 'URL de l''image principale du service';

-- =============================================================================
-- 10. Create helper view for service details
-- =============================================================================

CREATE VIEW services_full_details AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.category_id,
  s.subcategory_id,

  -- Pricing
  s.base_price,
  s.cost_price,
  CASE
    WHEN s.cost_price IS NOT NULL AND s.cost_price > 0
    THEN ROUND(((s.base_price - s.cost_price) / s.base_price * 100)::NUMERIC, 2)
    ELSE NULL
  END AS margin_percentage,

  -- Duration
  s.base_duration_minutes,

  -- Descriptions
  s.intro,
  s.description, -- Old short description
  s.long_description,

  -- Professional info
  s.hygienic_precautions,
  s.contraindications,
  s.advises,
  s.your_session,
  s.preparation,
  s.suggestion,

  -- Targeting
  s.for_men,
  s.for_women,
  s.for_kids,

  -- Business
  s.is_for_entreprise_ready,

  -- Sessions
  s.has_many_session,
  s.number_of_session,
  CASE
    WHEN s.has_many_session THEN s.base_price / s.number_of_session
    ELSE s.base_price
  END AS price_per_session,

  -- Service type
  s.is_additional_service,

  -- Media
  s.image_url,
  s.secondary_image_urls,
  s.video_url,

  -- Metadata
  s.tags,
  s.is_active,
  s.display_order,

  -- Categories (from services_with_categories view)
  cat.name AS category_name,
  cat.slug AS category_slug,
  cat.icon AS category_icon,
  subcat.name AS subcategory_name,
  subcat.slug AS subcategory_slug,
  CASE
    WHEN subcat.name IS NOT NULL THEN cat.name || ' > ' || subcat.name
    ELSE cat.name
  END AS full_category_path,

  -- Timestamps
  s.created_at,
  s.updated_at

FROM services s
LEFT JOIN service_categories cat ON s.category_id = cat.id
LEFT JOIN service_categories subcat ON s.subcategory_id = subcat.id;

COMMENT ON VIEW services_full_details IS 'Vue complète avec toutes les informations de service + catégories + calculs de marge';

GRANT SELECT ON services_full_details TO authenticated;
GRANT SELECT ON services_full_details TO anon;

-- =============================================================================
-- 11. Update existing services_with_categories view
-- =============================================================================

-- Drop and recreate services_with_categories to include new columns
DROP VIEW IF EXISTS services_with_categories;

CREATE VIEW services_with_categories AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.intro,
  s.description,
  s.long_description,
  s.base_price,
  s.base_duration_minutes,
  s.image_url,
  s.secondary_image_urls,
  s.video_url,
  s.is_active,
  s.display_order,
  s.tags,
  s.for_men,
  s.for_women,
  s.for_kids,
  s.has_many_session,
  s.number_of_session,
  s.is_additional_service,

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

COMMENT ON VIEW services_with_categories IS 'Services avec informations complètes de catégorie et sous-catégorie (vue publique sans coûts)';

GRANT SELECT ON services_with_categories TO authenticated;
GRANT SELECT ON services_with_categories TO anon;

-- =============================================================================
-- 12. Create indexes for performance
-- =============================================================================

-- Index for client targeting filters
CREATE INDEX idx_services_targeting ON services(for_men, for_women, for_kids) WHERE is_active = true;

-- Index for enterprise services
CREATE INDEX idx_services_enterprise ON services(is_for_entreprise_ready) WHERE is_active = true AND is_for_entreprise_ready = true;

-- Index for session packages
CREATE INDEX idx_services_packages ON services(has_many_session) WHERE is_active = true AND has_many_session = true;

-- Index for additional services
CREATE INDEX idx_services_additional ON services(is_additional_service) WHERE is_active = true AND is_additional_service = true;

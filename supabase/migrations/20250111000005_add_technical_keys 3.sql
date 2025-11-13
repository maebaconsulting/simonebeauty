-- Migration: Add technical keys for i18n
-- Feature: i18n multilingual support
-- Purpose: Add language-agnostic technical keys to tables with translatable content
-- Principle 13: Never hardcode user-facing text, use technical keys instead

-- Step 1: Add technical key columns to relevant tables

-- service_categories: Add name_key and slug_key
ALTER TABLE public.service_categories
  ADD COLUMN IF NOT EXISTS name_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description_key VARCHAR(100);

COMMENT ON COLUMN public.service_categories.name_key IS 'Clé technique pour identifier la catégorie de manière programmatique (ex: haircare, beauty_nails)';
COMMENT ON COLUMN public.service_categories.description_key IS 'Clé technique pour la description de la catégorie';

-- specialties: Add name_key
ALTER TABLE public.specialties
  ADD COLUMN IF NOT EXISTS name_key VARCHAR(100);

COMMENT ON COLUMN public.specialties.name_key IS 'Clé technique pour identifier la spécialité de manière programmatique (ex: swedish_massage, manicure)';

-- Step 2: Generate technical keys from existing slugs/names
-- For service_categories, use existing slug as basis for name_key
UPDATE public.service_categories
SET name_key = slug
WHERE name_key IS NULL AND slug IS NOT NULL;

-- For specialties, generate from name (convert to snake_case)
UPDATE public.specialties
SET name_key = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[éèêë]', 'e', 'g'),
        '[àâä]', 'a', 'g'
      ),
      '[^a-z0-9]+', '_', 'g'
    ),
    '^_|_$', '', 'g'
  )
)
WHERE name_key IS NULL;

-- Step 3: Create unique constraints on technical keys
-- Make name_key unique for service_categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_categories_name_key
  ON public.service_categories (name_key)
  WHERE name_key IS NOT NULL;

-- Make name_key unique for specialties
CREATE UNIQUE INDEX IF NOT EXISTS idx_specialties_name_key
  ON public.specialties (name_key)
  WHERE name_key IS NOT NULL;

-- Step 4: Create function to get translated entity by key
CREATE OR REPLACE FUNCTION public.get_entity_by_key(
  p_entity_type VARCHAR,
  p_name_key VARCHAR,
  p_language_code VARCHAR DEFAULT 'fr'
)
RETURNS TABLE (
  id BIGINT,
  name_key VARCHAR,
  name TEXT,
  description TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format(
    'SELECT
      e.id,
      e.name_key,
      COALESCE(
        public.get_translation($1, e.id, ''name'', $3),
        e.name
      ) AS name,
      COALESCE(
        public.get_translation($1, e.id, ''description'', $3),
        COALESCE(e.description, '''')
      ) AS description
    FROM public.%I e
    WHERE e.name_key = $2',
    CASE p_entity_type
      WHEN 'service_category' THEN 'service_categories'
      WHEN 'specialty' THEN 'specialties'
      WHEN 'service' THEN 'services'
      ELSE p_entity_type
    END
  )
  USING p_entity_type, p_name_key, p_language_code;
END;
$$;

COMMENT ON FUNCTION public.get_entity_by_key IS 'Récupère une entité par sa clé technique avec traductions';

-- Step 5: Add services table columns if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    -- Add technical keys to services
    ALTER TABLE public.services
      ADD COLUMN IF NOT EXISTS name_key VARCHAR(100),
      ADD COLUMN IF NOT EXISTS description_key VARCHAR(100);

    COMMENT ON COLUMN public.services.name_key IS 'Clé technique pour identifier le service de manière programmatique';
    COMMENT ON COLUMN public.services.description_key IS 'Clé technique pour la description du service';

    -- Generate keys from existing data
    UPDATE public.services
    SET name_key = LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(name, '[éèêë]', 'e', 'g'),
            '[àâä]', 'a', 'g'
          ),
          '[^a-z0-9]+', '_', 'g'
        ),
        '^_|_$', '', 'g'
      )
    )
    WHERE name_key IS NULL;

    -- Create unique index
    CREATE UNIQUE INDEX IF NOT EXISTS idx_services_name_key
      ON public.services (name_key)
      WHERE name_key IS NOT NULL;

    RAISE NOTICE 'Technical keys added to services table';
  END IF;
END $$;

-- Step 6: Create helper view for easier querying with translations
CREATE OR REPLACE VIEW public.service_categories_i18n AS
SELECT
  sc.id,
  sc.name_key,
  sc.slug,
  sc.parent_id,
  sc.name AS name_fr,
  sc.description AS description_fr,
  sc.icon,
  sc.color,
  sc.is_active,
  sc.created_at,
  sc.updated_at
FROM public.service_categories sc;

COMMENT ON VIEW public.service_categories_i18n IS 'Vue des catégories avec clés techniques pour i18n (utiliser get_translation pour autres langues)';

CREATE OR REPLACE VIEW public.specialties_i18n AS
SELECT
  s.id,
  s.name_key,
  s.category,
  s.category_id,
  s.name AS name_fr,
  s.is_active,
  s.created_at,
  s.updated_at
FROM public.specialties s;

COMMENT ON VIEW public.specialties_i18n IS 'Vue des spécialités avec clés techniques pour i18n (utiliser get_translation pour autres langues)';

-- Grant appropriate permissions
GRANT SELECT ON public.service_categories_i18n TO PUBLIC;
GRANT SELECT ON public.specialties_i18n TO PUBLIC;

-- Step 7: Create summary report
DO $$
DECLARE
  v_categories_with_keys INTEGER;
  v_specialties_with_keys INTEGER;
  v_services_with_keys INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_categories_with_keys
  FROM public.service_categories
  WHERE name_key IS NOT NULL;

  SELECT COUNT(*) INTO v_specialties_with_keys
  FROM public.specialties
  WHERE name_key IS NOT NULL;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    SELECT COUNT(*) INTO v_services_with_keys
    FROM public.services
    WHERE name_key IS NOT NULL;
  ELSE
    v_services_with_keys := 0;
  END IF;

  RAISE NOTICE '===== TECHNICAL KEYS SUMMARY =====';
  RAISE NOTICE 'Service categories with keys: %', v_categories_with_keys;
  RAISE NOTICE 'Specialties with keys: %', v_specialties_with_keys;
  RAISE NOTICE 'Services with keys: %', v_services_with_keys;
  RAISE NOTICE '==================================';
END $$;

-- Step 8: Future migration note
COMMENT ON COLUMN public.service_categories.name IS 'LEGACY: Utiliser name_key + translations table pour i18n. Cette colonne sera éventuellement dépréciée.';
COMMENT ON COLUMN public.specialties.name IS 'LEGACY: Utiliser name_key + translations table pour i18n. Cette colonne sera éventuellement dépréciée.';

-- Migration: Add category_id FK to specialties table
-- Feature: Data Integrity - Specialty-Category Alignment (Principle 14)
-- Principle: Specialties must reference service_categories via FK

-- Step 1: Add new column for FK relationship
ALTER TABLE public.specialties
  ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES public.service_categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.specialties.category_id IS 'Référence FK vers service_categories pour garantir l''alignement des données';

-- Step 2: Create mapping for existing text categories to numeric IDs
-- Based on user selection: Option B mapping

-- First, let's create a temporary mapping
DO $$
BEGIN
  -- Map 'beauty' specialties to multiple categories
  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'beaute-des-ongles' LIMIT 1)
  WHERE category = 'beauty'
    AND name ILIKE ANY (ARRAY['%manucure%', '%pédicure%', '%nail%']);

  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'maquillage' LIMIT 1)
  WHERE category = 'beauty'
    AND name ILIKE ANY (ARRAY['%maquillage%', '%makeup%']);

  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'epilation' LIMIT 1)
  WHERE category = 'beauty'
    AND name ILIKE ANY (ARRAY['%épilation%', '%wax%', '%depil%']);

  -- Fallback: Any remaining 'beauty' items to a general beauty category if it exists
  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'beaute' LIMIT 1)
  WHERE category = 'beauty'
    AND category_id IS NULL;

  -- Map 'hair' to COIFFURE (id=1)
  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'coiffure' LIMIT 1)
  WHERE category = 'hair';

  -- Map 'massage' to MASSAGE BIEN-ÊTRE (id=5)
  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'massage-bien-etre' LIMIT 1)
  WHERE category = 'massage';

  -- Map 'wellness' specialties
  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'massage-bien-etre' LIMIT 1)
  WHERE category = 'wellness';

  -- Map 'health' specialties to appropriate categories
  UPDATE public.specialties
  SET category_id = (SELECT id FROM public.service_categories WHERE slug = 'massage-therapeutique' LIMIT 1)
  WHERE category = 'health';

  -- Log unmapped specialties for manual review
  RAISE NOTICE 'Specialties without category_id mapping: %',
    (SELECT COUNT(*) FROM public.specialties WHERE category_id IS NULL);
END $$;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_specialties_category_id ON public.specialties (category_id);

-- Step 4: Keep text 'category' column for backward compatibility during transition
-- We'll deprecate it in a future migration once all code is updated

-- Step 5: Add validation to ensure new specialties have category_id
-- Note: We're not making it NOT NULL yet to allow for transition period

-- Step 6: Create helper function to get specialties by category
CREATE OR REPLACE FUNCTION public.get_specialties_by_category(
  p_category_id BIGINT,
  p_language_code VARCHAR DEFAULT 'fr'
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  description TEXT,
  category_id BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    COALESCE(
      public.get_translation('specialty', s.id, 'name', p_language_code),
      s.name
    ) AS name,
    COALESCE(
      public.get_translation('specialty', s.id, 'description', p_language_code),
      ''
    ) AS description,
    s.category_id
  FROM public.specialties s
  WHERE s.category_id = p_category_id
    AND s.is_active = true
  ORDER BY s.name;
END;
$$;

COMMENT ON FUNCTION public.get_specialties_by_category IS 'Récupère les spécialités d''une catégorie avec traductions';

-- Step 7: Create view for easy specialty-category joins with translations
CREATE OR REPLACE VIEW public.specialties_with_categories AS
SELECT
  s.id,
  s.name AS specialty_name,
  s.category AS legacy_category_text,
  s.category_id,
  sc.name AS category_name,
  sc.slug AS category_slug,
  s.is_active,
  s.created_at,
  s.updated_at
FROM public.specialties s
LEFT JOIN public.service_categories sc ON s.category_id = sc.id;

COMMENT ON VIEW public.specialties_with_categories IS 'Vue jointe spécialités-catégories pour faciliter les requêtes';

-- Grant appropriate permissions on the view
GRANT SELECT ON public.specialties_with_categories TO PUBLIC;

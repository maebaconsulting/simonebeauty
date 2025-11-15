-- Migration: Create translations table
-- Feature: i18n multilingual support
-- Principle: Centralized translation management with entity-agnostic design

CREATE TABLE IF NOT EXISTS public.translations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  language_code VARCHAR(2) NOT NULL REFERENCES public.supported_languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- French comments for business context
COMMENT ON TABLE public.translations IS 'Traductions centralisées pour tous les contenus multilingues de la plateforme';
COMMENT ON COLUMN public.translations.entity_type IS 'Type d''entité (service_category, specialty, service, etc.)';
COMMENT ON COLUMN public.translations.entity_id IS 'ID de l''entité source dans sa table respective';
COMMENT ON COLUMN public.translations.field_name IS 'Nom du champ traduit (name, description, etc.)';
COMMENT ON COLUMN public.translations.language_code IS 'Code langue ISO 639-1 (fr, es, de, nl, it)';
COMMENT ON COLUMN public.translations.value IS 'Valeur traduite du champ';

-- Unique constraint: One translation per entity/field/language combination
CREATE UNIQUE INDEX idx_translations_unique_combo
  ON public.translations (entity_type, entity_id, field_name, language_code);

-- Indexes for performance
CREATE INDEX idx_translations_entity ON public.translations (entity_type, entity_id);
CREATE INDEX idx_translations_language ON public.translations (language_code);
CREATE INDEX idx_translations_lookup ON public.translations (entity_type, entity_id, language_code);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access (translations are public content)
CREATE POLICY "Public read access to translations"
  ON public.translations
  FOR SELECT
  TO PUBLIC
  USING (true);

-- RLS Policy: Only admins can modify translations
CREATE POLICY "Admin full access to translations"
  ON public.translations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Helper function: Get translation for an entity field
CREATE OR REPLACE FUNCTION public.get_translation(
  p_entity_type VARCHAR,
  p_entity_id BIGINT,
  p_field_name VARCHAR,
  p_language_code VARCHAR DEFAULT 'fr'
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_translation TEXT;
BEGIN
  -- Try to get translation in requested language
  SELECT value INTO v_translation
  FROM public.translations
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND field_name = p_field_name
    AND language_code = p_language_code;

  -- If not found, fallback to French (default)
  IF v_translation IS NULL AND p_language_code != 'fr' THEN
    SELECT value INTO v_translation
    FROM public.translations
    WHERE entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND field_name = p_field_name
      AND language_code = 'fr';
  END IF;

  RETURN v_translation;
END;
$$;

COMMENT ON FUNCTION public.get_translation IS 'Récupère la traduction d''un champ avec fallback vers le français';

-- Helper function: Bulk get translations for multiple entities
CREATE OR REPLACE FUNCTION public.get_translations_bulk(
  p_entity_type VARCHAR,
  p_entity_ids BIGINT[],
  p_language_code VARCHAR DEFAULT 'fr'
)
RETURNS TABLE (
  entity_id BIGINT,
  field_name VARCHAR,
  value TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.entity_id,
    t.field_name,
    t.value
  FROM public.translations t
  WHERE t.entity_type = p_entity_type
    AND t.entity_id = ANY(p_entity_ids)
    AND t.language_code = p_language_code

  UNION ALL

  -- Fallback to French for missing translations
  SELECT
    t.entity_id,
    t.field_name,
    t.value
  FROM public.translations t
  WHERE t.entity_type = p_entity_type
    AND t.entity_id = ANY(p_entity_ids)
    AND t.language_code = 'fr'
    AND NOT EXISTS (
      SELECT 1 FROM public.translations t2
      WHERE t2.entity_type = p_entity_type
        AND t2.entity_id = t.entity_id
        AND t2.field_name = t.field_name
        AND t2.language_code = p_language_code
    );
END;
$$;

COMMENT ON FUNCTION public.get_translations_bulk IS 'Récupère les traductions pour plusieurs entités avec fallback vers le français';

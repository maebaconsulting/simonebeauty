-- Migration: Migrate existing content to translations table
-- Feature: i18n multilingual support
-- Purpose: Populate translations table with existing French content as default

-- Step 1: Migrate service_categories names and descriptions
INSERT INTO public.translations (entity_type, entity_id, field_name, language_code, value)
SELECT
  'service_category' AS entity_type,
  id AS entity_id,
  'name' AS field_name,
  'fr' AS language_code,
  name AS value
FROM public.service_categories
WHERE name IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();

-- Migrate service_categories descriptions if they exist
INSERT INTO public.translations (entity_type, entity_id, field_name, language_code, value)
SELECT
  'service_category' AS entity_type,
  id AS entity_id,
  'description' AS field_name,
  'fr' AS language_code,
  description AS value
FROM public.service_categories
WHERE description IS NOT NULL AND description != ''
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();

-- Step 2: Migrate specialties names
INSERT INTO public.translations (entity_type, entity_id, field_name, language_code, value)
SELECT
  'specialty' AS entity_type,
  id AS entity_id,
  'name' AS field_name,
  'fr' AS language_code,
  name AS value
FROM public.specialties
WHERE name IS NOT NULL
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();

-- Step 3: Migrate services if the table exists
DO $$
BEGIN
  -- Check if services table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    -- Migrate service names
    INSERT INTO public.translations (entity_type, entity_id, field_name, language_code, value)
    SELECT
      'service' AS entity_type,
      id AS entity_id,
      'name' AS field_name,
      'fr' AS language_code,
      name AS value
    FROM public.services
    WHERE name IS NOT NULL
    ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = NOW();

    -- Migrate service descriptions
    INSERT INTO public.translations (entity_type, entity_id, field_name, language_code, value)
    SELECT
      'service' AS entity_type,
      id AS entity_id,
      'description' AS field_name,
      'fr' AS language_code,
      description AS value
    FROM public.services
    WHERE description IS NOT NULL AND description != ''
    ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = NOW();

    RAISE NOTICE 'Services table found and content migrated to translations';
  ELSE
    RAISE NOTICE 'Services table does not exist yet, skipping service migration';
  END IF;
END $$;

-- Step 4: Create summary report
DO $$
DECLARE
  v_category_count INTEGER;
  v_specialty_count INTEGER;
  v_service_count INTEGER;
  v_total_translations INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_category_count
  FROM public.translations
  WHERE entity_type = 'service_category';

  SELECT COUNT(*) INTO v_specialty_count
  FROM public.translations
  WHERE entity_type = 'specialty';

  SELECT COUNT(*) INTO v_service_count
  FROM public.translations
  WHERE entity_type = 'service';

  SELECT COUNT(*) INTO v_total_translations
  FROM public.translations;

  RAISE NOTICE '===== MIGRATION SUMMARY =====';
  RAISE NOTICE 'Service categories migrated: % translations', v_category_count;
  RAISE NOTICE 'Specialties migrated: % translations', v_specialty_count;
  RAISE NOTICE 'Services migrated: % translations', v_service_count;
  RAISE NOTICE 'Total translations: %', v_total_translations;
  RAISE NOTICE '============================';
END $$;

-- Step 5: Create trigger to auto-update translations when source content changes
CREATE OR REPLACE FUNCTION public.sync_translation_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_entity_type VARCHAR(50);
  v_field_name VARCHAR(50);
BEGIN
  -- Determine entity type based on table name
  v_entity_type := CASE TG_TABLE_NAME
    WHEN 'service_categories' THEN 'service_category'
    WHEN 'specialties' THEN 'specialty'
    WHEN 'services' THEN 'service'
    ELSE TG_TABLE_NAME
  END;

  -- Sync 'name' field if it changed
  IF (TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.translations (entity_type, entity_id, field_name, language_code, value)
    VALUES (v_entity_type, NEW.id, 'name', 'fr', NEW.name)
    ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = NOW();
  END IF;

  -- Sync 'description' field if it exists and changed
  IF TG_TABLE_NAME IN ('service_categories', 'services') THEN
    IF (TG_OP = 'UPDATE' AND OLD.description IS DISTINCT FROM NEW.description) OR TG_OP = 'INSERT' THEN
      IF NEW.description IS NOT NULL AND NEW.description != '' THEN
        INSERT INTO public.translations (entity_type, entity_id, field_name, language_code, value)
        VALUES (v_entity_type, NEW.id, 'description', 'fr', NEW.description)
        ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
          SET value = EXCLUDED.value,
              updated_at = NOW();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_translation_on_update IS 'Synchronise automatiquement les traductions françaises lors de modifications des tables source';

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS sync_translation_service_categories ON public.service_categories;
CREATE TRIGGER sync_translation_service_categories
  AFTER INSERT OR UPDATE ON public.service_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_translation_on_update();

DROP TRIGGER IF EXISTS sync_translation_specialties ON public.specialties;
CREATE TRIGGER sync_translation_specialties
  AFTER INSERT OR UPDATE ON public.specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_translation_on_update();

-- Apply to services table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS sync_translation_services ON public.services';
    EXECUTE 'CREATE TRIGGER sync_translation_services
      AFTER INSERT OR UPDATE ON public.services
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_translation_on_update()';
    RAISE NOTICE 'Trigger created for services table';
  END IF;
END $$;

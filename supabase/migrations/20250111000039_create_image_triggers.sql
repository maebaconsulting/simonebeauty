-- Migration: Create triggers and functions for image management
-- Feature: 017-image-management
-- Description: Auto-generate alt-text and enforce max images per entity
-- Created: 2025-01-11

-- ============================================================================
-- FUNCTION: Auto-generate fallback alt-text if empty
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_fallback_alt_text()
RETURNS TRIGGER AS $$
BEGIN
  -- For service_images
  IF TG_TABLE_NAME = 'service_images' AND (NEW.alt_text IS NULL OR NEW.alt_text = '') THEN
    SELECT CONCAT(s.name, ' - Simone Paris')
    INTO NEW.alt_text
    FROM services s
    WHERE s.id = NEW.service_id;
  END IF;

  -- For product_images
  IF TG_TABLE_NAME = 'product_images' AND (NEW.alt_text IS NULL OR NEW.alt_text = '') THEN
    IF NEW.variant_id IS NOT NULL THEN
      -- Variant image: include variant name
      SELECT CONCAT(p.name, ' - ', pv.variant_name, ' - Simone Paris')
      INTO NEW.alt_text
      FROM products p
      INNER JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.id = NEW.product_id AND pv.id = NEW.variant_id;
    ELSE
      -- Product image
      SELECT CONCAT(p.name, ' - Simone Paris')
      INTO NEW.alt_text
      FROM products p
      WHERE p.id = NEW.product_id;
    END IF;
  END IF;

  -- For conversation_attachments
  IF TG_TABLE_NAME = 'conversation_attachments' AND (NEW.alt_text IS NULL OR NEW.alt_text = '') THEN
    NEW.alt_text := 'Photo client - Simone Paris';
  END IF;

  -- Truncate to 125 chars
  NEW.alt_text := SUBSTRING(NEW.alt_text, 1, 125);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto alt-text generation
CREATE TRIGGER service_images_auto_alt_text
  BEFORE INSERT OR UPDATE ON service_images
  FOR EACH ROW
  EXECUTE FUNCTION generate_fallback_alt_text();

CREATE TRIGGER product_images_auto_alt_text
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION generate_fallback_alt_text();

CREATE TRIGGER conversation_attachments_auto_alt_text
  BEFORE INSERT OR UPDATE ON conversation_attachments
  FOR EACH ROW
  EXECUTE FUNCTION generate_fallback_alt_text();

-- ============================================================================
-- FUNCTION: Enforce max images per entity limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_max_images_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_images INT;
  current_count INT;
BEGIN
  -- Get max limit from platform_config
  SELECT (value::text)::INT INTO max_images
  FROM platform_config
  WHERE key = 'max_images_per_entity';

  IF max_images IS NULL THEN
    max_images := 10; -- Default fallback
  END IF;

  -- Count existing images for this entity
  IF TG_TABLE_NAME = 'service_images' THEN
    SELECT COUNT(*) INTO current_count
    FROM service_images
    WHERE service_id = NEW.service_id AND deleted_at IS NULL;
  ELSIF TG_TABLE_NAME = 'product_images' THEN
    SELECT COUNT(*) INTO current_count
    FROM product_images
    WHERE product_id = NEW.product_id
      AND COALESCE(variant_id, 0) = COALESCE(NEW.variant_id, 0)
      AND deleted_at IS NULL;
  END IF;

  IF current_count >= max_images THEN
    RAISE EXCEPTION 'Maximum number of images (%) reached for this entity', max_images;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for max images limit
CREATE TRIGGER service_images_check_limit
  BEFORE INSERT ON service_images
  FOR EACH ROW
  EXECUTE FUNCTION check_max_images_limit();

CREATE TRIGGER product_images_check_limit
  BEFORE INSERT ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION check_max_images_limit();

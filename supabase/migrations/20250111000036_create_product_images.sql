-- Migration: Create product_images table
-- Feature: 017-image-management
-- Description: Images for e-commerce products and their variants
-- Created: 2025-01-11

CREATE TABLE product_images (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  alt_text VARCHAR(125) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_size_bytes INT NOT NULL,
  width INT,
  height INT,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT product_images_alt_text_length CHECK (LENGTH(alt_text) <= 125),
  CONSTRAINT product_images_file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT product_images_dimensions_positive CHECK (
    (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
  )
);

-- Comments
COMMENT ON TABLE product_images IS 'Images des produits e-commerce avec support des variations';
COMMENT ON COLUMN product_images.product_id IS 'Référence au produit';
COMMENT ON COLUMN product_images.variant_id IS 'Référence à la variation (NULL = image du produit principal)';
COMMENT ON COLUMN product_images.storage_path IS 'Chemin relatif dans le bucket (ex: products/123/variant_456_red.jpg)';
COMMENT ON COLUMN product_images.display_order IS 'Ordre d''affichage (0 = premier, scope: product_id + variant_id)';
COMMENT ON COLUMN product_images.is_primary IS 'Image principale (une par produit ou variation)';
COMMENT ON COLUMN product_images.alt_text IS 'Texte alternatif (ex: "Vernis à ongles rouge brillant - Simone Paris")';
COMMENT ON COLUMN product_images.uploaded_by IS 'Admin/manager ayant uploadé l''image';
COMMENT ON COLUMN product_images.file_size_bytes IS 'Taille en octets';
COMMENT ON COLUMN product_images.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_variant_id ON product_images(variant_id) WHERE variant_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_product_images_display_order ON product_images(product_id, COALESCE(variant_id, 0), display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_deleted ON product_images(deleted_at) WHERE deleted_at IS NOT NULL;

-- Unique constraint: One primary per product (when variant_id IS NULL)
CREATE UNIQUE INDEX idx_product_images_unique_primary_product
  ON product_images(product_id)
  WHERE is_primary = true AND variant_id IS NULL AND deleted_at IS NULL;

-- Unique constraint: One primary per variant
CREATE UNIQUE INDEX idx_product_images_unique_primary_variant
  ON product_images(variant_id)
  WHERE is_primary = true AND variant_id IS NOT NULL AND deleted_at IS NULL;

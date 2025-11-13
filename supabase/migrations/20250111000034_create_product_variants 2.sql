-- Migration: Create product_variants table
-- Feature: 017-image-management
-- Description: Product variations (color, size, etc.) with their own images
-- Created: 2025-01-11

CREATE TABLE product_variants (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  variant_type VARCHAR(50) NOT NULL,
  sku VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_variants_variant_name_not_empty CHECK (LENGTH(TRIM(variant_name)) > 0),
  CONSTRAINT product_variants_variant_type_check CHECK (
    variant_type IN ('color', 'size', 'material', 'style', 'other')
  )
);

-- Comments
COMMENT ON TABLE product_variants IS 'Variations des produits (couleur, taille, etc.) avec images spécifiques';
COMMENT ON COLUMN product_variants.product_id IS 'Référence au produit parent';
COMMENT ON COLUMN product_variants.variant_name IS 'Nom de la variation (ex: "Rouge", "Large", "Coton")';
COMMENT ON COLUMN product_variants.variant_type IS 'Type de variation (color, size, material, style, other)';
COMMENT ON COLUMN product_variants.sku IS 'Stock Keeping Unit (code produit unique, optionnel)';

-- Indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;

-- Unique constraint: Prevent duplicate variant names within a product
CREATE UNIQUE INDEX idx_product_variants_unique_name
  ON product_variants(product_id, variant_type, variant_name);

-- Migration: Create products table (placeholder for future e-commerce)
-- Feature: 017-image-management (prerequisite)
-- Description: Minimal products table to support product_variants and product_images
-- Created: 2025-01-11
-- Note: This will be extended when full e-commerce feature is implemented

CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price_cents INT,
  category VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT products_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT products_price_positive CHECK (price_cents IS NULL OR price_cents >= 0)
);

-- Comments
COMMENT ON TABLE products IS 'Produits e-commerce - table placeholder pour future implémentation complète';
COMMENT ON COLUMN products.name IS 'Nom du produit';
COMMENT ON COLUMN products.description IS 'Description détaillée du produit';
COMMENT ON COLUMN products.price_cents IS 'Prix en centimes (ex: 1990 = 19.90€)';
COMMENT ON COLUMN products.category IS 'Catégorie du produit';
COMMENT ON COLUMN products.is_active IS 'Produit actif et visible sur le site';
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_products_category ON products(category) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_products_is_active ON products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NOT NULL;

-- Enable RLS (placeholder policies - will be enhanced with full e-commerce feature)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active products
CREATE POLICY "Public can view active products"
  ON products
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND deleted_at IS NULL);

-- Policy: Admins and managers can manage products
CREATE POLICY "Admins and managers full access on products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

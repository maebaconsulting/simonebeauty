-- Migration: 20250111000060_add_category_images.sql
-- Feature: Category Images (extension of 017-image-management)
-- Description: Add image_url field to service_categories for rich category visuals
-- Date: 2025-01-11

-- =============================================================================
-- 1. Add image_url column to service_categories
-- =============================================================================

ALTER TABLE service_categories
  ADD COLUMN image_url VARCHAR(500);

COMMENT ON COLUMN service_categories.image_url IS 'URL de l''image de la catégorie dans Supabase Storage (optionnel, fallback sur icon)';

-- =============================================================================
-- 2. Create category-images storage bucket
-- =============================================================================

-- Note: Storage buckets must be created via Supabase Dashboard or using Supabase CLI
-- Bucket name: category-images
-- Public: true (read access for everyone)
-- File size limit: 2MB (smaller than service images as these are icons)
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- SQL to create bucket (run manually or via Supabase Dashboard):
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);
*/

-- =============================================================================
-- 3. Create RLS policies for category-images bucket
-- =============================================================================

-- Note: RLS policies for storage buckets
-- These policies should be created in Supabase Dashboard > Storage > category-images > Policies

-- Policy 1: Public read access
/*
CREATE POLICY "Public can view category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');
*/

-- Policy 2: Admin/Manager can upload
/*
CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'category-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);
*/

-- Policy 3: Admin/Manager can update
/*
CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'category-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);
*/

-- Policy 4: Admin/Manager can delete
/*
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'category-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);
*/

-- =============================================================================
-- 4. Update services_with_categories view to include category images
-- =============================================================================

DROP VIEW IF EXISTS services_with_categories;

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
  cat.image_url AS category_image_url, -- NEW: Category image

  -- Subcategory
  subcat.id AS subcategory_id,
  subcat.name AS subcategory_name,
  subcat.slug AS subcategory_slug,
  subcat.icon AS subcategory_icon,
  subcat.image_url AS subcategory_image_url, -- NEW: Subcategory image

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

COMMENT ON VIEW services_with_categories IS 'Services avec informations complètes de catégorie/sous-catégorie incluant les images';

GRANT SELECT ON services_with_categories TO authenticated;
GRANT SELECT ON services_with_categories TO anon;

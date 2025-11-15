-- Migration: Create Storage Buckets and RLS Policies for Image Management
-- Feature: 017-image-management
-- Description: Create storage buckets and policies for service, product, and conversation images

-- ============================================================================
-- Create Storage Buckets
-- ============================================================================

-- Service images bucket (public read, admin/manager write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true, -- Public read access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Product images bucket (public read, admin/manager write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Public read access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Conversation attachments bucket (private, authenticated write, moderated read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conversation-attachments',
  'conversation-attachments',
  false, -- Private access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- Storage Policies for service-images bucket
-- ============================================================================

-- Policy: Anyone can view service images (public read)
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Policy: Admins and managers can upload service images
DROP POLICY IF EXISTS "Admins and managers can upload service images" ON storage.objects;
CREATE POLICY "Admins and managers can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy: Admins and managers can update service images
DROP POLICY IF EXISTS "Admins and managers can update service images" ON storage.objects;
CREATE POLICY "Admins and managers can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  bucket_id = 'service-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy: Admins and managers can delete service images
DROP POLICY IF EXISTS "Admins and managers can delete service images" ON storage.objects;
CREATE POLICY "Admins and managers can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- ============================================================================
-- Storage Policies for product-images bucket
-- ============================================================================

-- Policy: Anyone can view product images (public read)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy: Admins and managers can upload product images
DROP POLICY IF EXISTS "Admins and managers can upload product images" ON storage.objects;
CREATE POLICY "Admins and managers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy: Admins and managers can update product images
DROP POLICY IF EXISTS "Admins and managers can update product images" ON storage.objects;
CREATE POLICY "Admins and managers can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy: Admins and managers can delete product images
DROP POLICY IF EXISTS "Admins and managers can delete product images" ON storage.objects;
CREATE POLICY "Admins and managers can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- ============================================================================
-- Storage Policies for conversation-attachments bucket
-- ============================================================================

-- Policy: Users can view their own conversation attachments
DROP POLICY IF EXISTS "Users can view their own conversation attachments" ON storage.objects;
CREATE POLICY "Users can view their own conversation attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'conversation-attachments'
  AND (
    -- User uploaded the attachment
    auth.uid() IN (
      SELECT uploaded_by_user_id
      FROM conversation_attachments
      WHERE storage_path = name
    )
    OR
    -- User is participant in the conversation
    auth.uid() IN (
      SELECT client_id FROM conversations
      WHERE id IN (
        SELECT conversation_id
        FROM conversation_attachments
        WHERE storage_path = name
      )
      UNION
      SELECT contractor_id FROM conversations
      WHERE id IN (
        SELECT conversation_id
        FROM conversation_attachments
        WHERE storage_path = name
      )
    )
  )
);

-- Policy: Authenticated users can upload conversation attachments
DROP POLICY IF EXISTS "Authenticated users can upload conversation attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload conversation attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'conversation-attachments');

-- Policy: Users can delete their own conversation attachments
DROP POLICY IF EXISTS "Users can delete their own conversation attachments" ON storage.objects;
CREATE POLICY "Users can delete their own conversation attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'conversation-attachments'
  AND auth.uid() IN (
    SELECT uploaded_by_user_id
    FROM conversation_attachments
    WHERE storage_path = name
  )
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Public can view service images" ON storage.objects IS 'Allow public read access to service images';
COMMENT ON POLICY "Admins and managers can upload service images" ON storage.objects IS 'Allow admins and managers to upload new service images';
COMMENT ON POLICY "Admins and managers can update service images" ON storage.objects IS 'Allow admins and managers to update existing service images';
COMMENT ON POLICY "Admins and managers can delete service images" ON storage.objects IS 'Allow admins and managers to delete service images';

COMMENT ON POLICY "Public can view product images" ON storage.objects IS 'Allow public read access to product images';
COMMENT ON POLICY "Admins and managers can upload product images" ON storage.objects IS 'Allow admins and managers to upload new product images';
COMMENT ON POLICY "Admins and managers can update product images" ON storage.objects IS 'Allow admins and managers to update existing product images';
COMMENT ON POLICY "Admins and managers can delete product images" ON storage.objects IS 'Allow admins and managers to delete product images';

COMMENT ON POLICY "Users can view their own conversation attachments" ON storage.objects IS 'Allow users to view attachments from their own conversations';
COMMENT ON POLICY "Authenticated users can upload conversation attachments" ON storage.objects IS 'Allow authenticated users to upload conversation attachments';
COMMENT ON POLICY "Users can delete their own conversation attachments" ON storage.objects IS 'Allow users to delete their own attachments';

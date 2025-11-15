-- Migration: Create RLS policies for image tables
-- Feature: 017-image-management
-- Description: Enable RLS and create security policies for all image tables
-- Created: 2025-01-11

-- ============================================================================
-- SERVICE_IMAGES RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can do everything
CREATE POLICY "Admins and managers full access on service_images"
  ON service_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Everyone can view non-deleted service images
CREATE POLICY "Public can view service images"
  ON service_images
  FOR SELECT
  TO authenticated, anon
  USING (deleted_at IS NULL);

-- ============================================================================
-- PRODUCT_IMAGES RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can do everything
CREATE POLICY "Admins and managers full access on product_images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Everyone can view non-deleted product images
CREATE POLICY "Public can view product images"
  ON product_images
  FOR SELECT
  TO authenticated, anon
  USING (deleted_at IS NULL);

-- ============================================================================
-- PRODUCT_VARIANTS RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can manage variants
CREATE POLICY "Admins and managers full access on product_variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Everyone can view variants
CREATE POLICY "Public can view product_variants"
  ON product_variants
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================================================
-- CONVERSATION_ATTACHMENTS RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE conversation_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload attachments to their own conversations
CREATE POLICY "Users can insert attachments to own conversations"
  ON conversation_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN appointment_bookings b ON c.booking_id = b.id
      WHERE c.id = conversation_attachments.conversation_id
        AND b.client_id = auth.uid()
    )
  );

-- Policy: Users can view approved attachments in their own conversations
CREATE POLICY "Users can view approved attachments in own conversations"
  ON conversation_attachments
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN appointment_bookings b ON c.booking_id = b.id
      WHERE c.id = conversation_attachments.conversation_id
        AND (b.client_id = auth.uid() OR b.contractor_id = auth.uid())
    )
  );

-- Policy: Admins/managers can view all attachments (for moderation)
CREATE POLICY "Admins can view all conversation attachments"
  ON conversation_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Policy: Admins/managers can update attachments (for moderation)
CREATE POLICY "Admins can moderate conversation attachments"
  ON conversation_attachments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Migration: Create conversations table (placeholder for future messaging system)
-- Feature: 017-image-management (prerequisite)
-- Description: Minimal conversations table to support conversation_attachments
-- Created: 2025-01-11
-- Note: This will be extended when messaging system (Spec 009) is implemented

CREATE TABLE conversations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  booking_id BIGINT REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  subject VARCHAR(200),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT conversations_status_check CHECK (
    status IN ('active', 'closed', 'archived')
  )
);

-- Comments
COMMENT ON TABLE conversations IS 'Conversations/threads de messages - table placeholder pour future implémentation (Spec 009)';
COMMENT ON COLUMN conversations.booking_id IS 'Référence à la réservation associée';
COMMENT ON COLUMN conversations.subject IS 'Sujet de la conversation';
COMMENT ON COLUMN conversations.status IS 'Statut: active, closed, archived';

-- Indexes
CREATE INDEX idx_conversations_booking_id ON conversations(booking_id);
CREATE INDEX idx_conversations_status ON conversations(status, updated_at DESC);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations they're part of
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointment_bookings b
      WHERE b.id = conversations.booking_id
        AND (b.client_id = auth.uid() OR b.contractor_id = auth.uid())
    )
  );

-- Policy: Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- Migration: Create conversation_attachments table
-- Feature: 017-image-management
-- Description: User-generated content (UGC) images with moderation workflow
-- Created: 2025-01-11

CREATE TABLE conversation_attachments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  booking_id BIGINT REFERENCES appointment_bookings(id) ON DELETE SET NULL,
  uploaded_by_user_id UUID NOT NULL REFERENCES profiles(id),
  storage_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(125),
  moderation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,
  file_size_bytes INT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT conversation_attachments_alt_text_length CHECK (
    alt_text IS NULL OR LENGTH(alt_text) <= 125
  ),
  CONSTRAINT conversation_attachments_moderation_status_check CHECK (
    moderation_status IN ('pending', 'approved', 'rejected', 'under_review')
  ),
  CONSTRAINT conversation_attachments_file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT conversation_attachments_moderation_logic CHECK (
    (moderation_status = 'pending' AND moderated_by IS NULL AND moderated_at IS NULL) OR
    (moderation_status != 'pending' AND moderated_by IS NOT NULL AND moderated_at IS NOT NULL)
  )
);

-- Comments
COMMENT ON TABLE conversation_attachments IS 'Photos uploadées par les clients dans les conversations avec workflow de modération';
COMMENT ON COLUMN conversation_attachments.conversation_id IS 'Référence à la conversation (thread de messages)';
COMMENT ON COLUMN conversation_attachments.booking_id IS 'Référence optionnelle à la réservation associée';
COMMENT ON COLUMN conversation_attachments.uploaded_by_user_id IS 'Client ayant uploadé la photo';
COMMENT ON COLUMN conversation_attachments.storage_path IS 'Chemin dans le bucket (ex: conversations/789/photo_123.jpg)';
COMMENT ON COLUMN conversation_attachments.alt_text IS 'Texte alternatif (généré automatiquement si vide)';
COMMENT ON COLUMN conversation_attachments.moderation_status IS 'Statut: pending, approved, rejected, under_review';
COMMENT ON COLUMN conversation_attachments.moderated_by IS 'Admin/manager ayant modéré';
COMMENT ON COLUMN conversation_attachments.moderated_at IS 'Date de modération';
COMMENT ON COLUMN conversation_attachments.moderation_reason IS 'Raison du rejet (si rejected)';
COMMENT ON COLUMN conversation_attachments.deleted_at IS 'Soft delete (utilisé pour contenu inapproprié)';

-- Indexes
CREATE INDEX idx_conversation_attachments_conversation_id ON conversation_attachments(conversation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversation_attachments_user_id ON conversation_attachments(uploaded_by_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversation_attachments_moderation_status ON conversation_attachments(moderation_status, uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversation_attachments_moderated_by ON conversation_attachments(moderated_by) WHERE moderated_by IS NOT NULL;
CREATE INDEX idx_conversation_attachments_deleted ON conversation_attachments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Migration: Create service_images table
-- Feature: 017-image-management
-- Description: Images associated with services (coiffure, ongles, massage, etc.)
-- Created: 2025-01-11

CREATE TABLE service_images (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
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
  CONSTRAINT service_images_alt_text_length CHECK (LENGTH(alt_text) <= 125),
  CONSTRAINT service_images_file_size_positive CHECK (file_size_bytes > 0),
  CONSTRAINT service_images_dimensions_positive CHECK (
    (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
  )
);

-- Comments (French for business context)
COMMENT ON TABLE service_images IS 'Images associées aux services de la plateforme avec métadonnées';
COMMENT ON COLUMN service_images.service_id IS 'Référence au service (coiffure, ongles, etc.)';
COMMENT ON COLUMN service_images.storage_path IS 'Chemin relatif dans le bucket Supabase Storage (ex: services/4/coiffure_123.jpg)';
COMMENT ON COLUMN service_images.display_order IS 'Ordre d''affichage dans la galerie (0 = premier)';
COMMENT ON COLUMN service_images.is_primary IS 'Image principale affichée par défaut (une seule par service)';
COMMENT ON COLUMN service_images.alt_text IS 'Texte alternatif pour accessibilité et SEO (max 125 caractères WCAG)';
COMMENT ON COLUMN service_images.uploaded_by IS 'Utilisateur ayant uploadé l''image (admin/manager)';
COMMENT ON COLUMN service_images.file_size_bytes IS 'Taille du fichier en octets (validation max 5MB)';
COMMENT ON COLUMN service_images.width IS 'Largeur en pixels (extrait après upload)';
COMMENT ON COLUMN service_images.height IS 'Hauteur en pixels (extrait après upload)';
COMMENT ON COLUMN service_images.deleted_at IS 'Date de suppression (soft delete pour récupération)';

-- Indexes
CREATE INDEX idx_service_images_service_id ON service_images(service_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_images_display_order ON service_images(service_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_images_is_primary ON service_images(service_id, is_primary) WHERE is_primary = true AND deleted_at IS NULL;
CREATE INDEX idx_service_images_deleted ON service_images(deleted_at) WHERE deleted_at IS NOT NULL;

-- Unique constraint: Only one primary image per service
CREATE UNIQUE INDEX idx_service_images_unique_primary
  ON service_images(service_id)
  WHERE is_primary = true AND deleted_at IS NULL;

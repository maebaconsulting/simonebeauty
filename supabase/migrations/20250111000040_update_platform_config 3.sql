-- Migration: Update platform_config for image management
-- Feature: 017-image-management
-- Description: Add configuration keys for image management settings
-- Created: 2025-01-11

-- Insert or update image management configuration
-- Note: value column is JSONB, so we store values as JSON
INSERT INTO platform_config (key, value, description, updated_at, updated_by)
VALUES
  ('max_file_size_mb', '5'::jsonb, 'Taille maximale des fichiers image en MB', NOW(), NULL),
  ('max_images_per_entity', '10'::jsonb, 'Nombre maximal d''images par service/produit/conversation', NOW(), NULL),
  ('storage_quota_alert_percent', '80'::jsonb, 'Pourcentage de quota de stockage déclenchant une alerte', NOW(), NULL),
  ('ugc_moderation_required', 'true'::jsonb, 'Activer la modération obligatoire des photos UGC', NOW(), NULL),
  ('alt_text_generation_enabled', 'true'::jsonb, 'Activer la génération automatique d''alt-text via IA', NOW(), NULL)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = EXCLUDED.updated_at;

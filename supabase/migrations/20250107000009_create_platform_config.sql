-- Migration: 20250107000009_create_platform_config.sql
-- Feature: 007 - Contractor Interface
-- Description: Create platform config table with RLS and seed data
-- Date: 2025-11-07

CREATE TABLE platform_config (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

COMMENT ON TABLE platform_config IS 'Configuration globale de la plateforme (paramètres système, listes de valeurs)';
COMMENT ON COLUMN platform_config.key IS 'Clé unique du paramètre (ex: forbidden_slugs, commission_default)';
COMMENT ON COLUMN platform_config.value IS 'Valeur JSONB flexible (peut être array, object, string, number)';

-- RLS Policies
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform config"
ON platform_config FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage platform config"
ON platform_config FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Seed: forbidden slugs
INSERT INTO platform_config (key, value, description) VALUES (
  'forbidden_slugs',
  '["admin", "api", "www", "book", "search", "login", "register", "support", "help", "contact", "about", "dashboard", "settings", "account", "profile", "bookings", "payments", "test", "dev", "staging", "prod", "stripe", "supabase", "simone", "contractor", "client", "user", "public", "private", "secret", "config", "database", "cache", "upload", "download", "delete", "create", "update", "null", "undefined", "true", "false", "home", "faq", "legal", "privacy", "terms", "blog", "news", "careers", "team", "pricing"]'::JSONB,
  'Liste des slugs interdits pour les URLs prestataires'
);

-- Seed: commission default
INSERT INTO platform_config (key, value, description) VALUES (
  'commission_default_percentage',
  '15.0'::JSONB,
  'Taux de commission par défaut appliqué aux nouveaux prestataires (15%)'
);

-- Seed: slug change limit
INSERT INTO platform_config (key, value, description) VALUES (
  'slug_change_limit_per_year',
  '3'::JSONB,
  'Nombre maximum de changements de slug autorisés par an et par prestataire'
);

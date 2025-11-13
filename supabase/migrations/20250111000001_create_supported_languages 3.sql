-- Migration: Create supported_languages table
-- Feature: i18n multilingual support
-- Principle: Numeric IDs, VARCHAR+CHECK (not ENUM)

CREATE TABLE IF NOT EXISTS public.supported_languages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code VARCHAR(2) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- French comments for business context
COMMENT ON TABLE public.supported_languages IS 'Langues supportées par la plateforme pour le système i18n';
COMMENT ON COLUMN public.supported_languages.code IS 'Code langue ISO 639-1 (2 lettres: fr, es, de, nl, it)';
COMMENT ON COLUMN public.supported_languages.name IS 'Nom de la langue en anglais (French, Spanish, German)';
COMMENT ON COLUMN public.supported_languages.native_name IS 'Nom de la langue dans sa langue native (Français, Español, Deutsch)';
COMMENT ON COLUMN public.supported_languages.is_default IS 'Langue par défaut de la plateforme (français uniquement)';
COMMENT ON COLUMN public.supported_languages.is_active IS 'Langue activée pour l''utilisation sur la plateforme';

-- Insert initial supported languages
INSERT INTO public.supported_languages (code, name, native_name, is_default, is_active) VALUES
  ('fr', 'French', 'Français', true, true),
  ('en', 'English', 'English', false, true),
  ('es', 'Spanish', 'Español', false, true),
  ('de', 'German', 'Deutsch', false, true),
  ('nl', 'Dutch', 'Nederlands', false, true),
  ('it', 'Italian', 'Italiano', false, true)
ON CONFLICT (code) DO NOTHING;

-- Ensure only one default language
CREATE UNIQUE INDEX idx_supported_languages_default
  ON public.supported_languages (is_default)
  WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.supported_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access (languages are public configuration)
CREATE POLICY "Public read access to supported languages"
  ON public.supported_languages
  FOR SELECT
  TO PUBLIC
  USING (is_active = true);

-- RLS Policy: Only admins can modify languages
CREATE POLICY "Admin full access to supported languages"
  ON public.supported_languages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Index for performance
CREATE INDEX idx_supported_languages_active ON public.supported_languages (is_active);
CREATE INDEX idx_supported_languages_code ON public.supported_languages (code);

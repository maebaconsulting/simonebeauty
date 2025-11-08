-- Migration: Create verification_codes table
-- Description: Stores temporary 6-digit verification codes for email verification and password reset
-- Author: Spec 001 - Authentication System
-- Date: 2025-11-07

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Add comments (French for business documentation)
COMMENT ON TABLE public.verification_codes IS 'Codes de vérification temporaires à 6 chiffres';
COMMENT ON COLUMN public.verification_codes.user_id IS 'UUID utilisateur associé au code';
COMMENT ON COLUMN public.verification_codes.code IS 'Code à 6 chiffres généré de manière cryptographiquement sécurisée';
COMMENT ON COLUMN public.verification_codes.type IS 'Type de vérification: email_verification ou password_reset';
COMMENT ON COLUMN public.verification_codes.attempts IS 'Nombre de tentatives de saisie (max 3)';
COMMENT ON COLUMN public.verification_codes.expires_at IS 'Date d''expiration (15 minutes après création)';

-- Create composite index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_type
  ON public.verification_codes(user_id, type, expires_at);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires
  ON public.verification_codes(expires_at);

-- Create function to clean up expired codes (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_verification_codes IS 'Supprime les codes de vérification expirés (à exécuter périodiquement)';

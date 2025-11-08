-- Migration: Add auth-related columns to existing profiles table
-- Description: Adds columns needed for authentication system to existing profiles table
-- Author: Spec 001 - Authentication System
-- Date: 2025-11-07
-- NOTE: profiles table already exists from Phase 1 database work

-- Add email_verified column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'profiles'
                AND column_name = 'email_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    COMMENT ON COLUMN public.profiles.email_verified IS 'Indicateur de vérification email';
  END IF;
END $$;

-- Add last_login_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'profiles'
                AND column_name = 'last_login_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
    COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp de la dernière connexion';
  END IF;
END $$;

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

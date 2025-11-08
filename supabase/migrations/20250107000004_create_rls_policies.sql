-- Migration: Create Row Level Security policies
-- Description: Implements RLS policies for profiles and verification_codes tables
-- Author: Spec 001 - Authentication System
-- Date: 2025-11-07

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on verification_codes table
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role has full access (for Edge Functions and admin operations)
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- VERIFICATION_CODES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own verification codes
CREATE POLICY "Users can view own verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role has full access (for Edge Functions to create/manage codes)
CREATE POLICY "Service role has full access to verification codes"
  ON public.verification_codes
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Add comments
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 'Les utilisateurs peuvent voir leur propre profil';
COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 'Les utilisateurs peuvent modifier leur propre profil';
COMMENT ON POLICY "Service role has full access to profiles" ON public.profiles IS 'Le service role a accès complet (Edge Functions, admin)';
COMMENT ON POLICY "Users can view own verification codes" ON public.verification_codes IS 'Les utilisateurs peuvent voir leurs propres codes de vérification';
COMMENT ON POLICY "Service role has full access to verification codes" ON public.verification_codes IS 'Le service role a accès complet pour créer/gérer les codes';

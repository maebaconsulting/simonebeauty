/**
 * Fix Slug Trigger and RLS Policies for Contractor Approval
 * Task: Fix critical trigger error and service role INSERT policies
 * Feature: 007-contractor-interface
 *
 * Problems Fixed:
 * 1. generate_contractor_slug() tries to access NEW.first_name/last_name which don't exist on contractors table
 * 2. slug column has DEFAULT '' causing unique constraint conflicts
 * 3. INSERT policies for contractor_profiles and contractor_onboarding_status don't allow service role
 */

-- ============================================================================
-- PART 1: Fix the generate_contractor_slug() trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_contractor_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 1;
  slug_exists BOOLEAN;
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Si slug déjà défini, ne rien faire
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Fetch first_name and last_name from profiles table (NOT from NEW)
  SELECT p.first_name, p.last_name
  INTO user_first_name, user_last_name
  FROM profiles p
  WHERE p.id = NEW.id;

  -- If no profile found, generate generic slug from ID
  IF user_first_name IS NULL OR user_last_name IS NULL THEN
    base_slug := 'contractor-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 12);
  ELSE
    -- Générer slug de base à partir du nom
    base_slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          UNACCENT(CONCAT(user_first_name, '-', user_last_name)),
          '[^a-z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    );

    -- Gérer les slugs trop courts
    IF LENGTH(base_slug) < 3 THEN
      base_slug := base_slug || '-contractor';
    END IF;
  END IF;

  -- Limiter la longueur à 50 caractères
  base_slug := SUBSTRING(base_slug, 1, 50);
  final_slug := base_slug;

  -- Vérifier l'unicité et ajouter suffixe si nécessaire
  LOOP
    SELECT EXISTS(SELECT 1 FROM contractors WHERE slug = final_slug) INTO slug_exists;
    EXIT WHEN NOT slug_exists;

    suffix := suffix + 1;
    final_slug := SUBSTRING(base_slug || '-' || suffix, 1, 50);
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: Remove problematic default empty string from slug column
-- ============================================================================

ALTER TABLE contractors ALTER COLUMN slug DROP DEFAULT;

-- ============================================================================
-- PART 3: Fix RLS policies to allow service role INSERT operations
-- ============================================================================

-- Replace contractor_profiles INSERT policy to allow service role OR admin
DROP POLICY IF EXISTS "Admins can insert contractor profiles" ON contractor_profiles;
CREATE POLICY "Service role and admins can insert contractor profiles"
  ON contractor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow service role (edge functions)
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    -- Allow admin users
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

-- Replace contractor_onboarding_status INSERT policy to allow service role OR admin
DROP POLICY IF EXISTS "Admins can insert onboarding status" ON contractor_onboarding_status;
CREATE POLICY "Service role and admins can insert onboarding status"
  ON contractor_onboarding_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow service role (edge functions)
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    -- Allow admin users
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role::text = 'admin'::text
    )
  );

-- ============================================================================
-- PART 4: Documentation
-- ============================================================================

COMMENT ON FUNCTION generate_contractor_slug() IS
  'Generates unique slug for contractors. Fetches first_name/last_name from profiles table instead of accessing non-existent columns on contractors table.';

COMMENT ON POLICY "Service role and admins can insert contractor profiles" ON contractor_profiles IS
  'Allows service role (edge functions) and admin users to create contractor profiles during approval process';

COMMENT ON POLICY "Service role and admins can insert onboarding status" ON contractor_onboarding_status IS
  'Allows service role (edge functions) and admin users to initialize onboarding status during approval process';

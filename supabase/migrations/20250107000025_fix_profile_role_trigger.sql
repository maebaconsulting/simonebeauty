/**
 * Fix Profile Role Trigger and Existing Contractor Profiles
 * Task: Fix profile role being hardcoded to 'client' instead of using user_metadata
 * Feature: 007-contractor-interface
 *
 * Problems Fixed:
 * 1. create_profile_on_signup() hardcodes role='client' instead of reading from user_metadata.role
 * 2. Existing contractors have role='client' instead of role='contractor'
 */

-- ============================================================================
-- PART 1: Fix the create_profile_on_signup() trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email_verified, first_name, last_name)
  VALUES (
    NEW.id,
    -- Read role from user_metadata, default to 'client' if not provided
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    FALSE,    -- Email not verified yet
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING; -- Ignore if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_profile_on_signup IS
  'Creates profile automatically on signup. Uses role from user_metadata if provided, defaults to client.';

-- ============================================================================
-- PART 2: Fix existing contractor profiles that have wrong role
-- ============================================================================

-- Update all profiles that correspond to contractors but have wrong role
UPDATE profiles
SET role = 'contractor'
WHERE id IN (
  SELECT id FROM contractors
)
AND role != 'contractor';

-- ============================================================================
-- PART 3: Documentation
-- ============================================================================

-- Add helpful comment
COMMENT ON COLUMN profiles.role IS
  'User role: client, contractor, admin, manager. Set from user_metadata.role during signup or by admin.';

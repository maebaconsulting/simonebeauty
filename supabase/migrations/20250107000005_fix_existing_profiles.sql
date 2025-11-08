-- Migration: Fix existing profiles without first_name/last_name
-- Description: Updates existing profiles to extract names from auth.users metadata
-- Author: Spec 001 - Authentication System - Bugfix
-- Date: 2025-11-07

-- Update existing profiles that don't have names but have them in auth.users metadata
UPDATE public.profiles p
SET
  first_name = COALESCE(p.first_name, (
    SELECT au.raw_user_meta_data->>'first_name'
    FROM auth.users au
    WHERE au.id = p.id
  )),
  last_name = COALESCE(p.last_name, (
    SELECT au.raw_user_meta_data->>'last_name'
    FROM auth.users au
    WHERE au.id = p.id
  ))
WHERE
  p.first_name IS NULL
  OR p.last_name IS NULL;

-- Log the fix
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles with missing names from auth.users metadata', updated_count;
END $$;

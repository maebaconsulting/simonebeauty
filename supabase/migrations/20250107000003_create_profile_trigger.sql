-- Migration: Create trigger for automatic profile creation
-- Description: Automatically creates a profile in public.profiles when a new user signs up in auth.users
-- Author: Spec 001 - Authentication System
-- Date: 2025-11-07
-- NOTE: Adapted for existing profiles schema with role, first_name, last_name

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email_verified, first_name, last_name)
  VALUES (
    NEW.id,
    'client', -- Default role is client (contractors are created by admin)
    FALSE,    -- Email not verified yet
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING; -- Ignore if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_profile_on_signup IS 'Crée automatiquement un profil client lors de l''inscription';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_on_signup();

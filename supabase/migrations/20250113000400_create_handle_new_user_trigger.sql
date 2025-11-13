-- Migration: Create trigger to automatically create profile for new auth users
-- Feature: 001-authentication-system
-- Issue: "Database error saving new user" on signup
-- Root Cause: No automatic profile creation + no INSERT RLS policy

-- ============================================================================
-- PART 1: Create function to handle new user profile creation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile for the new auth user
  -- The trigger will automatically generate the client_code via profiles_generate_client_code_trigger
  INSERT INTO public.profiles (
    id,
    email_verified,
    role,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    false,
    'client',
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );

  RETURN NEW;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a profile record when a new user signs up via Supabase Auth. Triggered by INSERT on auth.users table.';

-- ============================================================================
-- PART 2: Create trigger on auth.users
-- ============================================================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Triggers handle_new_user() function to create a profile whenever a new user signs up';

-- ============================================================================
-- PART 3: Add INSERT policy for profiles (fallback/manual profile creation)
-- ============================================================================

-- This policy allows authenticated users to insert their own profile
-- Useful if the trigger fails or for manual profile creation scenarios
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Users can insert own profile" ON public.profiles IS
'Allows authenticated users to insert their own profile record (fallback if trigger fails)';

/**
 * Add Custom Access Token Hook for JWT Role Claims
 * Feature: 018-international-market-segmentation
 *
 * This hook injects the user's role from the profiles table into the JWT
 * so that RLS policies can check auth.jwt()->>'role' to grant admin access.
 *
 * Reference: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
 */

-- Create the custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_role text;
  claims jsonb;
BEGIN
  -- Get the user's role from the profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Get existing claims
  claims := event->'claims';

  -- Add the role claim
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;

  -- Return the event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute permission to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Add comment
COMMENT ON FUNCTION public.custom_access_token_hook IS
  'Custom access token hook that injects user role from profiles table into JWT claims. Required for admin RLS policies.';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✓ Custom access token hook created successfully';
  RAISE NOTICE 'IMPORTANT: You must enable this hook in the Supabase Dashboard:';
  RAISE NOTICE '1. Go to Authentication > Hooks';
  RAISE NOTICE '2. Enable "custom_access_token_hook" for the "Custom Access Token" hook type';
  RAISE NOTICE '3. Or use the Supabase CLI: supabase secrets set HOOK_CUSTOM_ACCESS_TOKEN_URI=pg-functions://postgres/custom_access_token_hook';
END $$;

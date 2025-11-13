-- Migration: 20250113000300_create_client_stats_function.sql
-- Description: Create RPC function to get client statistics (bookings and addresses count)
-- This bypasses the FK relationship issue between profiles and client_addresses/appointment_bookings

-- Function to get stats for a single client
CREATE OR REPLACE FUNCTION get_client_stats(p_profile_id UUID)
RETURNS TABLE(
  bookings_count BIGINT,
  addresses_count BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (
      SELECT COUNT(*)
      FROM appointment_bookings ab
      WHERE ab.client_id = p_profile_id
    ) as bookings_count,
    (
      SELECT COUNT(*)
      FROM client_addresses ca
      WHERE ca.client_id = p_profile_id
        AND ca.is_active = true
    ) as addresses_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_stats TO authenticated, anon;

COMMENT ON FUNCTION get_client_stats IS
'Get client statistics (bookings and addresses count) for a given profile ID.
Works around the FK relationship issue where client_addresses.client_id and
appointment_bookings.client_id reference auth.users(id) instead of profiles(id).
Security: SECURITY DEFINER allows counting across tables with proper RLS.';

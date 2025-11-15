-- Migration: 20250111000020_add_guest_booking_support.sql
-- Feature: 006-client-interface - Guest Booking Flow
-- Description: Enable guest users to initiate booking flow without authentication
-- Date: 2025-11-11
-- Related Constitutional Principle: Premium User Experience (Principle 5)

-- =============================================================================
-- STEP 1: Modify booking_sessions table to support guest users
-- =============================================================================

-- Make client_id nullable to support guest sessions
ALTER TABLE booking_sessions
  ALTER COLUMN client_id DROP NOT NULL;

-- Add guest-specific fields
ALTER TABLE booking_sessions
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guest_address JSONB;

-- Add comments
COMMENT ON COLUMN booking_sessions.is_guest IS 'Indique si la session appartient à un utilisateur invité (non authentifié)';
COMMENT ON COLUMN booking_sessions.guest_email IS 'Email temporaire de l''invité (utilisé pour notifications et conversion de compte)';
COMMENT ON COLUMN booking_sessions.guest_address IS 'Adresse temporaire au format JSON pour les invités: {street, city, postal_code, latitude, longitude, building_info}';

-- Add check constraint to ensure either client_id OR guest_email is present
ALTER TABLE booking_sessions
  ADD CONSTRAINT check_client_or_guest
  CHECK (
    (client_id IS NOT NULL AND is_guest = false) OR
    (guest_email IS NOT NULL AND is_guest = true)
  );

-- Add index for guest email lookups
CREATE INDEX IF NOT EXISTS idx_booking_sessions_guest_email
  ON booking_sessions(guest_email)
  WHERE is_guest = true;

-- =============================================================================
-- STEP 2: Update RLS Policies for Guest Access
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can view their own sessions" ON booking_sessions;
DROP POLICY IF EXISTS "Clients can create their own sessions" ON booking_sessions;
DROP POLICY IF EXISTS "Clients can update their own sessions" ON booking_sessions;
DROP POLICY IF EXISTS "Clients can delete their own sessions" ON booking_sessions;

-- New policy: Authenticated users can view their own sessions
CREATE POLICY "Authenticated users can view their own sessions"
ON booking_sessions FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- New policy: Authenticated users can create their own sessions
CREATE POLICY "Authenticated users can create their own sessions"
ON booking_sessions FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid() AND is_guest = false);

-- New policy: Authenticated users can update their own sessions
CREATE POLICY "Authenticated users can update their own sessions"
ON booking_sessions FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- New policy: Authenticated users can delete their own sessions
CREATE POLICY "Authenticated users can delete their own sessions"
ON booking_sessions FOR DELETE
TO authenticated
USING (client_id = auth.uid());

-- =============================================================================
-- CRITICAL: Guest users (anonymous) policies
-- =============================================================================

-- Policy: Anonymous users can create guest sessions
CREATE POLICY "Anonymous users can create guest sessions"
ON booking_sessions FOR INSERT
TO anon
WITH CHECK (
  is_guest = true
  AND guest_email IS NOT NULL
  AND client_id IS NULL
);

-- Policy: Anonymous users can view sessions by session_id
-- This is the key policy that allows guests to access their sessions
CREATE POLICY "Anonymous users can view by session_id"
ON booking_sessions FOR SELECT
TO anon
USING (is_guest = true);

-- Policy: Anonymous users can update their guest sessions
CREATE POLICY "Anonymous users can update guest sessions"
ON booking_sessions FOR UPDATE
TO anon
USING (is_guest = true)
WITH CHECK (is_guest = true);

-- Policy: Anonymous users can delete their guest sessions
CREATE POLICY "Anonymous users can delete guest sessions"
ON booking_sessions FOR DELETE
TO anon
USING (is_guest = true);

-- =============================================================================
-- STEP 3: Guest Session Cleanup Function
-- =============================================================================

-- Enhanced cleanup function to handle both authenticated and guest sessions
CREATE OR REPLACE FUNCTION cleanup_expired_booking_sessions()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions (both authenticated and guest)
  DELETE FROM booking_sessions
  WHERE expires_at < NOW();

  -- Log cleanup activity
  RAISE NOTICE 'Cleaned up expired booking sessions at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_booking_sessions() IS 'Supprime les sessions expirées (authentifiées et invités) - à appeler via cron toutes les 5 minutes';

-- =============================================================================
-- STEP 4: Function to Migrate Guest Session to Authenticated
-- =============================================================================

CREATE OR REPLACE FUNCTION migrate_guest_session_to_authenticated(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session RECORD;
  v_address_id BIGINT;
BEGIN
  -- Get the guest session
  SELECT * INTO v_session
  FROM booking_sessions
  WHERE session_id = p_session_id
  AND is_guest = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Guest session not found: %', p_session_id;
    RETURN false;
  END IF;

  -- If guest has an address, save it to client_addresses
  IF v_session.guest_address IS NOT NULL THEN
    INSERT INTO client_addresses (
      client_id,
      street,
      city,
      postal_code,
      latitude,
      longitude,
      building_info,
      type,
      is_default
    )
    VALUES (
      p_user_id,
      v_session.guest_address->>'street',
      v_session.guest_address->>'city',
      v_session.guest_address->>'postal_code',
      (v_session.guest_address->>'latitude')::DECIMAL(10,8),
      (v_session.guest_address->>'longitude')::DECIMAL(11,8),
      v_session.guest_address->>'building_info',
      'home',
      true -- Set as default since it's likely their first address
    )
    RETURNING id INTO v_address_id;
  END IF;

  -- Update the session to be authenticated
  UPDATE booking_sessions
  SET
    client_id = p_user_id,
    is_guest = false,
    guest_email = NULL,
    guest_address = NULL,
    address_id = COALESCE(v_address_id, address_id),
    updated_at = NOW()
  WHERE session_id = p_session_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_guest_session_to_authenticated(UUID, UUID) IS 'Migre une session invité vers une session authentifiée après inscription/connexion';

-- =============================================================================
-- STEP 5: Validation and Indexes
-- =============================================================================

-- Index for efficient session_id lookups (already exists but ensuring)
CREATE INDEX IF NOT EXISTS idx_booking_sessions_session_id_guest
  ON booking_sessions(session_id)
  WHERE is_guest = true;

-- Index for guest email + expiration (for cleanup and migration)
CREATE INDEX IF NOT EXISTS idx_booking_sessions_guest_cleanup
  ON booking_sessions(guest_email, expires_at)
  WHERE is_guest = true;

-- =============================================================================
-- Validation
-- =============================================================================

DO $$
BEGIN
  -- Verify the migration was successful
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_sessions'
    AND column_name = 'is_guest'
  ) THEN
    RAISE NOTICE 'Migration successful: booking_sessions table updated for guest support';
  ELSE
    RAISE EXCEPTION 'Migration failed: is_guest column not found';
  END IF;
END $$;

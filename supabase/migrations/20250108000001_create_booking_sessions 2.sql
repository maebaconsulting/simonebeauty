-- Migration: 20250108000001_create_booking_sessions.sql
-- Feature: Booking Flow - Session Management
-- Description: Create booking_sessions table for persisting booking state during flow
-- Date: 2025-11-08

-- =============================================================================
-- booking_sessions - Sessions de réservation temporaires
-- =============================================================================

CREATE TABLE booking_sessions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Session unique ID
  session_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  -- Relations
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES services(id) ON DELETE SET NULL,
  address_id BIGINT REFERENCES client_addresses(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Booking details (JSON for flexibility)
  timeslot JSONB, -- {date, start_time, end_time, contractor_id}
  additional_services JSONB, -- Array of service IDs
  pricing_breakdown JSONB, -- {base_price, service_amount, promo_discount, gift_card_amount, final_amount}

  -- Promo & Gift Cards
  promo_code_id BIGINT,
  promo_code VARCHAR(50),
  promo_discount_amount DECIMAL(10, 2) DEFAULT 0,
  gift_card_id BIGINT,
  gift_card_code VARCHAR(50),
  gift_card_amount DECIMAL(10, 2) DEFAULT 0,

  -- Flow tracking
  current_step INT DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
  -- 1: service selection
  -- 2: address selection
  -- 3: timeslot selection
  -- 4: payment/confirmation

  -- Session metadata
  source VARCHAR(50) DEFAULT 'catalog', -- 'catalog', 'contractor_slug', 'ready_to_go'
  contractor_slug VARCHAR(255), -- If booked via contractor slug
  contractor_locked BOOLEAN DEFAULT false, -- If contractor cannot be changed

  -- Expiration
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  last_activity_at TIMESTAMP DEFAULT NOW(),

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Commentaires
COMMENT ON TABLE booking_sessions IS 'Sessions temporaires de réservation avec expiration 30min';
COMMENT ON COLUMN booking_sessions.session_id IS 'UUID unique de session pour côté client';
COMMENT ON COLUMN booking_sessions.current_step IS 'Étape actuelle: 1=service, 2=adresse, 3=créneau, 4=paiement';
COMMENT ON COLUMN booking_sessions.timeslot IS 'Créneau sélectionné au format JSON: {date, start_time, end_time, contractor_id}';
COMMENT ON COLUMN booking_sessions.pricing_breakdown IS 'Détail des prix au format JSON';
COMMENT ON COLUMN booking_sessions.contractor_locked IS 'Si true, le prestataire ne peut pas être changé (booking via slug)';
COMMENT ON COLUMN booking_sessions.expires_at IS 'Date d''expiration de la session (30 minutes par défaut)';
COMMENT ON COLUMN booking_sessions.last_activity_at IS 'Dernière activité utilisateur pour rafraîchir l''expiration';

-- Indexes
CREATE INDEX idx_booking_sessions_client ON booking_sessions(client_id);
CREATE INDEX idx_booking_sessions_session_id ON booking_sessions(session_id);
CREATE INDEX idx_booking_sessions_expires ON booking_sessions(expires_at);
CREATE INDEX idx_booking_sessions_service ON booking_sessions(service_id) WHERE service_id IS NOT NULL;

-- Trigger: Refresh expiration on activity
CREATE OR REPLACE FUNCTION refresh_session_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Si last_activity_at est modifié, refresh expires_at
  IF NEW.last_activity_at > OLD.last_activity_at THEN
    NEW.expires_at = NEW.last_activity_at + INTERVAL '30 minutes';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_session_expiration
BEFORE UPDATE ON booking_sessions
FOR EACH ROW
WHEN (NEW.last_activity_at IS DISTINCT FROM OLD.last_activity_at)
EXECUTE FUNCTION refresh_session_expiration();

-- Trigger: Updated at
CREATE OR REPLACE FUNCTION update_booking_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_booking_sessions_updated_at
BEFORE UPDATE ON booking_sessions
FOR EACH ROW
EXECUTE FUNCTION update_booking_sessions_updated_at();

-- RLS Policies
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;

-- Clients can view their own sessions
CREATE POLICY "Clients can view their own sessions"
ON booking_sessions FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- Clients can create their own sessions
CREATE POLICY "Clients can create their own sessions"
ON booking_sessions FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- Clients can update their own sessions
CREATE POLICY "Clients can update their own sessions"
ON booking_sessions FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Clients can delete their own sessions
CREATE POLICY "Clients can delete their own sessions"
ON booking_sessions FOR DELETE
TO authenticated
USING (client_id = auth.uid());

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON booking_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Function: Cleanup expired sessions (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_booking_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM booking_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_booking_sessions() IS 'Supprime les sessions expirées (à appeler via cron toutes les 5 minutes)';

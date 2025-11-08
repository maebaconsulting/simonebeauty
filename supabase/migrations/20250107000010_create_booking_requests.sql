-- Migration: 20250107000010_create_booking_requests.sql
-- Feature: 007 - Contractor Interface
-- Description: Create booking requests table with indexes and RLS policies
-- Date: 2025-11-07

CREATE TABLE booking_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  booking_id BIGINT UNIQUE NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,

  -- Statut de la demande
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'expired')),

  -- Délais
  requested_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  responded_at TIMESTAMP,

  -- Réponse du prestataire
  contractor_message TEXT, -- Message optionnel lors du refus
  refusal_reason VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE booking_requests IS 'Demandes de réservations en attente de validation par le prestataire (délai 24h)';
COMMENT ON COLUMN booking_requests.status IS 'Statut: pending (en attente), accepted (accepté), refused (refusé), expired (délai dépassé)';
COMMENT ON COLUMN booking_requests.expires_at IS 'Date limite de réponse (24h après demande). Après expiration, statut passe à expired automatiquement';
COMMENT ON COLUMN booking_requests.contractor_message IS 'Message optionnel du prestataire au client (surtout en cas de refus)';
COMMENT ON COLUMN booking_requests.refusal_reason IS 'Motif de refus si status = refused';

-- Indexes
CREATE INDEX idx_booking_requests_contractor ON booking_requests(contractor_id, status);
CREATE INDEX idx_booking_requests_expires ON booking_requests(expires_at) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own requests"
ON booking_requests FOR SELECT
TO authenticated
USING (
  contractor_id = auth.uid()
);

CREATE POLICY "Contractors can update own requests"
ON booking_requests FOR UPDATE
TO authenticated
USING (
  contractor_id = auth.uid()
);

CREATE POLICY "Admins can view all requests"
ON booking_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger: auto-expire after 24h
-- This will be handled by a cron job (see Edge Function: expire-pending-requests.ts)

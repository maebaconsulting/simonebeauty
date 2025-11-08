-- Migration: 20250107000011_create_service_action_logs.sql
-- Feature: 007 - Contractor Interface
-- Description: Create service action logs table with indexes and RLS policies
-- Date: 2025-11-07

CREATE TABLE service_action_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  booking_id BIGINT NOT NULL REFERENCES appointment_bookings(id) ON DELETE CASCADE,

  -- Action
  action_type VARCHAR(100) NOT NULL,
  performed_by_type VARCHAR(50) NOT NULL CHECK (performed_by_type IN ('client', 'contractor', 'admin', 'system')),
  performed_by_id UUID REFERENCES profiles(id),

  -- Détails
  action_details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Contexte
  ip_address VARCHAR(45),
  user_agent TEXT
);

COMMENT ON TABLE service_action_logs IS 'Logs de toutes les actions effectuées sur les réservations pour traçabilité et audit';
COMMENT ON COLUMN service_action_logs.action_type IS 'Type d''action: completed_by_contractor, payment_captured, tip_added, cancelled, refunded, etc.';
COMMENT ON COLUMN service_action_logs.performed_by_type IS 'Qui a effectué l''action: client, contractor, admin, system (automatique)';
COMMENT ON COLUMN service_action_logs.action_details IS 'Détails supplémentaires en JSON (montants, motifs, etc.)';

-- Indexes
CREATE INDEX idx_service_action_logs_booking ON service_action_logs(booking_id, timestamp DESC);
CREATE INDEX idx_service_action_logs_performed_by ON service_action_logs(performed_by_id);

-- RLS Policies
ALTER TABLE service_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view logs for own bookings"
ON service_action_logs FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT b.id FROM appointment_bookings b
    WHERE b.contractor_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all logs"
ON service_action_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
